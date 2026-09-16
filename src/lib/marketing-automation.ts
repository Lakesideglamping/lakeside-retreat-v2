import { prisma } from "./db";
import { logger } from "./logger";
import { nzToday, addDays } from "./date-range";
import {
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
  created_at: Date | null;
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
 * Find bookings that checked out today and have not yet been asked for a
 * review.
 *
 * Sent on departure day rather than two days later. The cron fires at 04:00
 * UTC — 16:00 in Cromwell, six hours after the 10am check-out — so the stay
 * is fresh and the guest is likely still travelling, which is when the note
 * reads as a farewell rather than a marketing follow-up.
 *
 * Counted in New Zealand, not on the server. At 04:00 UTC the two happen to
 * agree, but only because of the hour chosen; anchoring to NZ means moving
 * the slot later cannot silently start targeting the wrong day.
 *
 * check_out is a DATE column and a DATE compares as that day at 00:00 UTC, so
 * the bounds are built with Date.UTC from the NZ date.
 */
export async function findReviewCandidates(): Promise<Booking[]> {
  const today = nzToday();
  const [y, m, d] = today.split("-").map(Number);
  const startOfDay = new Date(Date.UTC(y, m - 1, d));
  const endOfDay = new Date(Date.UTC(y, m - 1, d + 1));

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
 * How far ahead of check-in the arrival instructions go out.
 *
 * Three days gives a guest time to act on them — plan the drive, check the
 * forecast, ask a question and get an answer before they set off. The cron
 * that calls this runs once a day, so this is also the only thing deciding
 * when the email lands; the template's wording must stay in step with it.
 */
const PRE_ARRIVAL_LEAD_DAYS = 3;

/**
 * A booking made inside this window of its own arrival gets no pre-arrival
 * email.
 *
 * Someone who books two days out does not need "your stay starts soon" — they
 * know, they just booked, and the confirmation already carries the address and
 * the check-in time. Sending it anyway reads as a system talking to itself.
 *
 * Under the current schedule this is belt-and-braces: the cron only looks at
 * check-ins three days out, so a late booking is already past that window and
 * would never be picked up. It is enforced explicitly so that widening the
 * window, adding a catch-up run, or backfilling cannot quietly start mailing
 * guests who booked yesterday.
 *
 * Measured to the start of the arrival day, not the 3pm check-in, so it is the
 * arrival date the guest booked against.
 */
const MIN_BOOKING_LEAD_MS = 72 * 60 * 60 * 1000;

/**
 * Find bookings checking in PRE_ARRIVAL_LEAD_DAYS from now (pre-arrival).
 */
export async function findPreArrivalBookings(): Promise<Booking[]> {
  // Three days out, counted in New Zealand. The old version used the server's
  // own date, which on Render is UTC — 12–13 hours behind Cromwell — so for
  // half of every day it targeted the wrong calendar day. check_in is a DATE
  // column, and a DATE compares as that day at 00:00 UTC, so the bounds are
  // built with Date.UTC from the NZ date rather than from local time.
  const target = addDays(nzToday(), PRE_ARRIVAL_LEAD_DAYS);
  const [y, m, d] = target.split("-").map(Number);
  const startOfDay = new Date(Date.UTC(y, m - 1, d));
  const endOfDay = new Date(Date.UTC(y, m - 1, d + 1));

  const bookings = await prisma.bookings.findMany({
    where: {
      check_in: { gte: startOfDay, lt: endOfDay },
      payment_status: { in: ["paid", "paid_external"] },
      status: "confirmed",
      deleted_at: null,
      ...directBookingWhere,
    },
  });

  // Skip anyone who booked inside the lead time. Postgres can compare two
  // columns but Prisma's `where` cannot, and the set here is one day's
  // arrivals, so it is filtered in memory.
  const eligible = (bookings as unknown as Booking[]).filter((b) => {
    if (!b.created_at) return true; // no timestamp — don't silently drop them
    const leadMs = b.check_in.getTime() - b.created_at.getTime();
    if (leadMs >= MIN_BOOKING_LEAD_MS) return true;
    logger.info("Pre-arrival skipped — booked inside the lead time", {
      job: "pre-arrival",
      bookingId: b.id,
      hoursBeforeArrival: Math.round(leadMs / (60 * 60 * 1000)),
    });
    return false;
  });

  return eligible;
}

// --- Processing functions ---

/**
 * Send the post-stay review email and record it in review_requests.
 *
 * Throws on failure rather than swallowing, so the caller can count it and
 * alert. It used to catch-and-log, which meant a failed send left the cron
 * reporting success while the guest silently got nothing — and because the
 * finder only looks at a single day's departures, that guest is never picked
 * up again. A miss here is permanent, so it has to be visible.
 *
 * Returns which of the two non-failure outcomes happened, so the caller can
 * count sends without counting skips.
 */
export async function processReviewRequest(
  booking: Booking
): Promise<"sent" | "skipped"> {
  // Check if a request already exists. findReviewCandidates already excludes
  // these, so this is a second line of defence against a concurrent run.
  const existing = await prisma.review_requests.findUnique({
    where: { booking_id: booking.id },
  });

  if (existing) {
    logger.info("Review request already exists for booking, skipping", {
      bookingId: booking.id,
    });
    return "skipped";
  }

  logger.info("Sending review request email", {
    bookingId: booking.id,
    guestEmail: booking.guest_email,
  });

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

  logger.info("Review request sent and recorded", { bookingId: booking.id });
  return "sent";
}

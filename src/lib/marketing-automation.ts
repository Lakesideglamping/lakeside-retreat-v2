import { prisma } from "./db";
import { logger } from "./logger";
import { sendAbandonedCheckoutReminder } from "./email";

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

const MAX_ABANDONED_REMINDERS = 3;

// --- Query helpers ---

/**
 * Find bookings with payment_status='pending' created more than 1 hour ago.
 * These represent checkout flows that were started but never completed.
 */
export async function findAbandonedCheckouts(): Promise<Booking[]> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const bookings = await prisma.bookings.findMany({
    where: {
      payment_status: "pending",
      deleted_at: null,
      created_at: { lt: oneHourAgo },
    },
  });

  return bookings as unknown as Booking[];
}

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
      payment_status: "completed",
      status: "confirmed",
      deleted_at: null,
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
      payment_status: "completed",
      status: "confirmed",
      deleted_at: null,
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
      payment_status: "completed",
      status: "confirmed",
      deleted_at: null,
    },
  });

  return bookings as unknown as Booking[];
}

// --- Processing functions ---

/**
 * Send an abandoned checkout reminder for a booking.
 * Tracks reminders in the abandoned_checkout_reminders table.
 * Max 3 reminders per booking.
 */
export async function processAbandonedCheckout(booking: Booking): Promise<void> {
  try {
    // Look up existing reminder record
    const existing = await prisma.abandoned_checkout_reminders.findUnique({
      where: { booking_id: booking.id },
    });

    const currentCount = existing?.reminder_count ?? 0;

    if (currentCount >= MAX_ABANDONED_REMINDERS) {
      logger.info("Max reminders reached for booking, skipping", {
        bookingId: booking.id,
        reminderCount: currentCount,
      });
      return;
    }

    const newCount = currentCount + 1;
    const now = new Date().toISOString();

    logger.info("Sending abandoned checkout reminder", {
      bookingId: booking.id,
      guestEmail: booking.guest_email,
      reminderNumber: newCount,
    });

    await sendAbandonedCheckoutReminder({
      guest_name: booking.guest_name,
      guest_email: booking.guest_email,
      accommodation: booking.accommodation,
      check_in: booking.check_in.toISOString(),
      check_out: booking.check_out.toISOString(),
      num_guests: booking.guests,
      total_price: booking.total_price ? String(booking.total_price) : undefined,
      booking_id: booking.id,
      reminderNumber: newCount,
    });

    // Upsert the reminder tracking record
    await prisma.abandoned_checkout_reminders.upsert({
      where: { booking_id: booking.id },
      create: {
        booking_id: booking.id,
        guest_email: booking.guest_email,
        guest_name: booking.guest_name,
        accommodation: booking.accommodation,
        check_in: booking.check_in.toISOString(),
        check_out: booking.check_out.toISOString(),
        reminder_count: newCount,
        last_reminder_sent_at: now,
      },
      update: {
        reminder_count: newCount,
        last_reminder_sent_at: now,
        last_error: null,
      },
    });

    logger.info("Abandoned checkout reminder sent", {
      bookingId: booking.id,
      reminderNumber: newCount,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("Failed to process abandoned checkout", {
      bookingId: booking.id,
      error: message,
    });

    // Record the failure
    try {
      await prisma.abandoned_checkout_reminders.upsert({
        where: { booking_id: booking.id },
        create: {
          booking_id: booking.id,
          guest_email: booking.guest_email,
          guest_name: booking.guest_name,
          accommodation: booking.accommodation,
          last_error: message,
        },
        update: {
          last_error: message,
        },
      });
    } catch {
      // Swallow — already logged the primary error
    }
  }
}

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

    // Send the review request email (placeholder — integrate with email service)
    logger.info("Sending review request email", {
      bookingId: booking.id,
      guestEmail: booking.guest_email,
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

import { NextResponse } from "next/server";
import { verifyCronSecret } from "@/lib/cron-auth";
import { logger } from "@/lib/logger";
import { sendSystemAlert } from "@/lib/email";
import { prisma } from "@/lib/db";
import { syncBooking } from "@/lib/uplisting";

// Maximum automatic retries before we stop trying and alert loudly.
// Beyond this the admin must investigate and manually re-trigger via
// the admin UI (or /api/admin/bookings/:id/sync).
const MAX_RETRIES = 3;

/**
 * Retry all website bookings whose Uplisting calendar sync previously failed.
 *
 * Why a separate cron instead of inline retries at webhook time:
 *  - The webhook handler runs inside a 10-second Stripe timeout; Uplisting
 *    retries with exponential backoff could push it over the limit.
 *  - A cron gives us a clean audit trail and a cap on total retry attempts.
 *  - syncBooking() is idempotent (same dates → same block), so retrying is safe.
 *
 * Runs once per cron tick (hourly). Caps at MAX_RETRIES to avoid endlessly
 * hammering a broken Uplisting API.
 */
export async function GET(request: Request) {
  return POST(request);
}

export async function POST(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let synced = 0;
  let failed = 0;
  let skipped = 0;

  try {
    // Only retry website-sourced bookings; OTA bookings (imported from
    // Uplisting) don't need to be synced back. Also limit to bookings where
    // the check-out is in the future or recent past — no point syncing
    // bookings from 6 months ago.
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7); // re-try up to 7 days after checkout

    const failedBookings = await prisma.bookings.findMany({
      where: {
        uplisting_sync_status: "failed",
        booking_source: "website",
        check_out: { gte: cutoff },
        deleted_at: null,
        // Only retry bookings that haven't exceeded the cap.
        uplisting_sync_retries: { lt: MAX_RETRIES },
      },
      select: {
        id: true,
        accommodation: true,
        check_in: true,
        check_out: true,
        guest_name: true,
        guest_email: true,
        guest_phone: true,
        guests: true,
        total_price: true,
        uplisting_sync_retries: true,
      },
      take: 50,
      orderBy: { check_in: "asc" },
    });

    if (failedBookings.length === 0) {
      return NextResponse.json({ success: true, synced: 0, failed: 0, skipped: 0 });
    }

    logger.info("retry-uplisting-sync: found failed bookings", {
      count: failedBookings.length,
    });

    for (const booking of failedBookings) {
      try {
        await syncBooking({
          accommodation: booking.accommodation,
          checkIn: booking.check_in.toISOString().split("T")[0],
          checkOut: booking.check_out.toISOString().split("T")[0],
          guestName: booking.guest_name,
          guestEmail: booking.guest_email,
          guestPhone: booking.guest_phone ?? undefined,
          guests: booking.guests,
          totalPrice: booking.total_price ? Number(booking.total_price) : undefined,
        });

        await prisma.bookings.update({
          where: { id: booking.id },
          data: { uplisting_sync_status: "synced", updated_at: new Date() },
        });

        synced++;
        logger.info("retry-uplisting-sync: booking synced", { bookingId: booking.id });
      } catch (err) {
        failed++;
        const errMsg = err instanceof Error ? err.message : String(err);
        const newRetryCount = (booking.uplisting_sync_retries ?? 0) + 1;
        const isExhausted = newRetryCount >= MAX_RETRIES;

        await prisma.bookings.update({
          where: { id: booking.id },
          data: {
            uplisting_sync_retries: newRetryCount,
            // Mark permanently failed once cap is reached so it's excluded
            // from future cron runs and visible in admin as needing attention.
            ...(isExhausted ? { uplisting_sync_status: "sync_failed_permanent" } : {}),
            updated_at: new Date(),
          },
        }).catch(() => {});

        logger.error("retry-uplisting-sync: retry failed", {
          bookingId: booking.id,
          retryCount: newRetryCount,
          exhausted: isExhausted,
          error: errMsg,
        });

        if (isExhausted) {
          sendSystemAlert(
            "UPLISTING_SYNC_EXHAUSTED",
            `Uplisting sync permanently failed for booking ${booking.id}`,
            `Booking ID: ${booking.id}\nAccommodation: ${booking.accommodation}\nDates: ${booking.check_in.toISOString().split("T")[0]} → ${booking.check_out.toISOString().split("T")[0]}\nRetries: ${newRetryCount}/${MAX_RETRIES}\nManual sync required — double-booking risk until resolved.\nLast error: ${errMsg}`
          ).catch(() => {});
        }
      }
    }

    // Alert if there are still persistently failing bookings after retries.
    // These need manual intervention.
    const stillFailing = await prisma.bookings.count({
      where: {
        uplisting_sync_status: "failed",
        booking_source: "website",
        check_out: { gte: cutoff },
        deleted_at: null,
      },
    });

    if (stillFailing > 0) {
      sendSystemAlert(
        "UPLISTING_SYNC_STILL_FAILING",
        `${stillFailing} booking(s) still failing Uplisting sync after retry`,
        `These bookings have a double-booking risk until resolved.\n\nThis tick: ${synced} synced, ${failed} still failing.\n\nCheck admin → Bookings and filter by uplisting_sync_status=failed.`
      ).catch(() => {});
    }

    return NextResponse.json({ success: true, synced, failed, skipped });
  } catch (err) {
    logger.error("retry-uplisting-sync cron failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    sendSystemAlert(
      "CRON_FAILURE",
      "retry-uplisting-sync cron failed",
      err instanceof Error ? err.message : String(err)
    ).catch(() => {});
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

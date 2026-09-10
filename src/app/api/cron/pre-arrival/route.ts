import { NextResponse } from "next/server";
import { verifyCronSecret } from "@/lib/cron-auth";
import { logger } from "@/lib/logger";
import { findPreArrivalBookings } from "@/lib/marketing-automation";
import { sendPreArrivalInstructions, sendSystemAlert } from "@/lib/email";
import { prisma } from "@/lib/db";

const TEMPLATE = "pre_arrival";

export async function POST(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const bookings = await findPreArrivalBookings();

    // Skip any booking that already has a successful send for this template.
    // Guards against cron running twice a day or retrying after a partial failure.
    const alreadySent = await prisma.email_sends.findMany({
      where: {
        booking_id: { in: bookings.map((b) => b.id) },
        template: TEMPLATE,
        status: "sent",
      },
      select: { booking_id: true },
    });
    const sentIds = new Set(alreadySent.map((r) => r.booking_id));
    const pending = bookings.filter((b) => !sentIds.has(b.id));

    let sent = 0;
    const failures: string[] = [];

    // One booking per try/catch. sendAndLog rethrows on failure, so without
    // this a single bad address ends the loop and every guest behind it in
    // the batch silently gets nothing.
    for (const booking of pending) {
      try {
        await sendPreArrivalInstructions({
          ...booking,
          guest_name: booking.guest_name ?? "Guest",
          guest_email: booking.guest_email,
          accommodation: booking.accommodation ?? "",
          check_in: booking.check_in.toISOString(),
          check_out: booking.check_out.toISOString(),
          total_price: booking.total_price ? Number(booking.total_price) : undefined,
          booking_id: booking.id,
        });
        sent++;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        logger.error("Pre-arrival email failed for booking", {
          job: "pre-arrival",
          bookingId: booking.id,
          error: message,
        });
        failures.push(`${booking.id}: ${message}`);
      }
    }

    logger.info("Pre-arrival email processing completed", {
      job: "pre-arrival",
      sent,
      failed: failures.length,
    });

    // Alert once for the batch, after every booking has had its turn.
    if (failures.length > 0) {
      sendSystemAlert(
        "CRON_FAILURE",
        `Pre-arrival: ${failures.length} of ${pending.length} email(s) failed`,
        failures.join("\n")
      ).catch(() => {});
    }

    return NextResponse.json({ success: true, sent, failed: failures.length });
  } catch (error) {
    logger.error("Pre-arrival email processing failed", {
      job: "pre-arrival",
      error: String(error),
    });
    sendSystemAlert("CRON_FAILURE", "Cron job failed: pre-arrival", String(error)).catch(() => {});
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

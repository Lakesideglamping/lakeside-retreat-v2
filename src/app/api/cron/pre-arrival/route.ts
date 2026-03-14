import { NextResponse } from "next/server";
import { verifyCronSecret } from "@/lib/cron-auth";
import { logger } from "@/lib/logger";
import { findPreArrivalBookings } from "@/lib/marketing-automation";
import { sendPreArrivalInstructions, sendSystemAlert } from "@/lib/email";

export async function POST(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const bookings = await findPreArrivalBookings();
    let sent = 0;

    for (const booking of bookings) {
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
    }

    logger.info("Pre-arrival email processing completed", {
      job: "pre-arrival",
      sent,
    });

    return NextResponse.json({ success: true, sent });
  } catch (error) {
    logger.error("Pre-arrival email processing failed", {
      job: "pre-arrival",
      error: String(error),
    });
    sendSystemAlert("CRON_FAILURE", "Cron job failed: pre-arrival", String(error)).catch(() => {});
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

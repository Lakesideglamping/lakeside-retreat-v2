import { NextResponse } from "next/server";
import { verifyCronSecret } from "@/lib/cron-auth";
import { logger } from "@/lib/logger";
import { findDuringStayBookings } from "@/lib/marketing-automation";
import { sendDuringStayCheckin } from "@/lib/email";

export async function POST(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const bookings = await findDuringStayBookings();
    let sent = 0;

    for (const booking of bookings) {
      await sendDuringStayCheckin({
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

    logger.info("During-stay email processing completed", {
      job: "during-stay",
      sent,
    });

    return NextResponse.json({ success: true, sent });
  } catch (error) {
    logger.error("During-stay email processing failed", {
      job: "during-stay",
      error: String(error),
    });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

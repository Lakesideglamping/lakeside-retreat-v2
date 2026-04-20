import { NextResponse } from "next/server";
import { verifyCronSecret } from "@/lib/cron-auth";
import { logger } from "@/lib/logger";
import { findDuringStayBookings } from "@/lib/marketing-automation";
import { sendDuringStayCheckin, sendSystemAlert } from "@/lib/email";
import { prisma } from "@/lib/db";

const TEMPLATE = "during_stay";

export async function POST(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const bookings = await findDuringStayBookings();

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

    for (const booking of pending) {
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
    sendSystemAlert("CRON_FAILURE", "Cron job failed: during-stay", String(error)).catch(() => {});
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

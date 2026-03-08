import { NextResponse } from "next/server";
import { withAdminMutation, getClientIp } from "@/lib/admin-route";
import { auditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  return withAdminMutation(request, async (admin) => {
    const { bookingId } = await params;

    const checkout =
      await prisma.abandoned_checkout_reminders.findUnique({
        where: { booking_id: bookingId },
      });

    if (!checkout) {
      return NextResponse.json(
        { error: "Abandoned checkout not found" },
        { status: 404 }
      );
    }

    const updated = await prisma.abandoned_checkout_reminders.update({
      where: { booking_id: bookingId },
      data: {
        reminder_count: (checkout.reminder_count ?? 0) + 1,
        last_reminder_sent_at: new Date().toISOString(),
      },
    });

    await auditLog(
      admin.username,
      "abandoned_checkout_reminder_sent",
      { bookingId, reminderCount: updated.reminder_count },
      getClientIp(request)
    );

    return NextResponse.json({ success: true, checkout: updated });
  });
}

import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/admin-route";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  return withAdmin(request, async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [
      failedPayments,
      syncFailures,
      pendingBookings,
      todayCheckIns,
      todayCheckOuts,
      recentMessages,
    ] = await Promise.all([
      prisma.bookings.count({
        where: { deleted_at: null, payment_status: "failed" },
      }),
      prisma.bookings.count({
        where: { deleted_at: null, uplisting_sync_status: "failed" },
      }),
      prisma.bookings.count({
        where: { deleted_at: null, status: "pending" },
      }),
      prisma.bookings.count({
        where: {
          deleted_at: null,
          check_in: { gte: today, lt: tomorrow },
        },
      }),
      prisma.bookings.count({
        where: {
          deleted_at: null,
          check_out: { gte: today, lt: tomorrow },
        },
      }),
      prisma.contact_messages.count({
        where: { created_at: { gte: twentyFourHoursAgo } },
      }),
    ]);

    return NextResponse.json({
      failedPayments,
      syncFailures,
      pendingBookings,
      todayCheckIns,
      todayCheckOuts,
      recentMessages,
    });
  });
}

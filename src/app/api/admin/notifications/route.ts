import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/admin-route";
import { prisma } from "@/lib/db";
import { nzTodayRangeUtc } from "@/lib/uplisting";

export async function GET(request: Request) {
  return withAdmin(request, async () => {
    // Match the SSR page exactly — shape + TZ. A prior version returned
    // different keys (pendingBookings instead of abandonedCheckouts /
    // pendingReviews), so clicking Refresh silently dropped two notification
    // cards.
    const { start: today, end: tomorrow } = nzTodayRangeUtc();

    const [
      failedPayments,
      syncFailures,
      abandonedCheckouts,
      pendingReviews,
      todayCheckIns,
      todayCheckOuts,
    ] = await Promise.all([
      prisma.bookings.count({
        where: { deleted_at: null, payment_status: "failed" },
      }),
      prisma.bookings.count({
        where: { deleted_at: null, uplisting_sync_status: "failed" },
      }),
      prisma.abandoned_checkout_reminders.count(),
      prisma.review_requests.count({
        where: { status: "pending" },
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
    ]);

    return NextResponse.json({
      failedPayments,
      syncFailures,
      abandonedCheckouts,
      pendingReviews,
      todayCheckIns,
      todayCheckOuts,
    });
  });
}

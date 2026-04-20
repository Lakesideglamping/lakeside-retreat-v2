import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/admin-route";
import { prisma } from "@/lib/db";
import { getValidIds } from "@/lib/accommodations";

type DateRange = "week" | "month" | "quarter" | "year";

function getStartDate(range: DateRange): Date {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  switch (range) {
    case "week":
      now.setDate(now.getDate() - 7);
      return now;
    case "month":
      now.setMonth(now.getMonth() - 1);
      return now;
    case "quarter":
      now.setMonth(now.getMonth() - 3);
      return now;
    case "year":
      now.setFullYear(now.getFullYear() - 1);
      return now;
    default:
      now.setMonth(now.getMonth() - 1);
      return now;
  }
}

function formatDateKey(date: Date, range: DateRange): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");

  if (range === "year" || range === "quarter") {
    return `${y}-${m}`;
  }
  return `${y}-${m}-${d}`;
}

export async function GET(request: Request) {
  return withAdmin(request, async () => {
    const { searchParams } = new URL(request.url);
    const range = (searchParams.get("dateRange") as DateRange) ?? "month";
    const validRanges: DateRange[] = ["week", "month", "quarter", "year"];
    const dateRange = validRanges.includes(range) ? range : "month";

    const startDate = getStartDate(dateRange);
    const endDate = new Date();

    // Keyed on check_in (stay date), not created_at (booking date). For a
    // small retreat the useful question is "what's July looking like?", not
    // "how many bookings landed this week?". Occupancy uses stay dates too,
    // so this keeps revenue and occupancy on the same time axis.
    // Refunded bookings are excluded — a refund reverses the Stripe charge.
    const whereClause = {
      deleted_at: null,
      status: { in: ["confirmed", "completed"] },
      payment_status: { not: "refunded" as const },
      check_in: { gte: startDate, lte: endDate },
    };

    // Summary stats. Occupancy is computed in SQL — previously we pulled
    // every booking row into Node and summed nights in JS, which was O(rows)
    // memory for a figure that's one scalar.
    const [aggregateResult, bookingCount, nightsResult] = await Promise.all([
      prisma.bookings.aggregate({
        _sum: { total_price: true },
        _avg: { total_price: true },
        where: whereClause,
      }),
      prisma.bookings.count({ where: whereClause }),
      // Clip each booking's nights to the overlap with [startDate, endDate]
      // so the numerator can never exceed totalPossibleNights. Also include
      // bookings that merely overlap the window, not just ones starting in it.
      prisma.$queryRaw<Array<{ total_nights: bigint | null }>>`
        SELECT COALESCE(SUM(
          GREATEST(
            LEAST(check_out, ${endDate}::date) - GREATEST(check_in, ${startDate}::date),
            0
          )
        ), 0)::bigint AS total_nights
        FROM bookings
        WHERE deleted_at IS NULL
          AND status IN ('confirmed', 'completed')
          AND check_in < ${endDate}::date
          AND check_out > ${startDate}::date
      `,
    ]);

    // Calculate occupancy rate (based on total possible nights in range)
    const totalDaysInRange = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const accommodationCount = getValidIds().length;
    const totalPossibleNights = totalDaysInRange * accommodationCount;
    const totalBookedNights = Number(nightsResult[0]?.total_nights ?? 0);
    const occupancyRate =
      totalPossibleNights > 0
        ? Math.round((totalBookedNights / totalPossibleNights) * 100)
        : 0;

    const summary = {
      totalRevenue: Number(aggregateResult._sum.total_price ?? 0),
      totalBookings: bookingCount,
      avgBookingValue: Number(aggregateResult._avg.total_price ?? 0),
      occupancyRate,
    };

    // Revenue time series - bucket by check_in so the chart shows revenue
    // aligned with the stays happening in the selected period.
    const timeSeriesBookings = await prisma.bookings.findMany({
      where: whereClause,
      select: {
        check_in: true,
        total_price: true,
      },
      orderBy: { check_in: "asc" },
    });

    const revenueMap = new Map<string, number>();
    for (const b of timeSeriesBookings) {
      if (!b.check_in) continue;
      const key = formatDateKey(new Date(b.check_in), dateRange);
      revenueMap.set(key, (revenueMap.get(key) ?? 0) + Number(b.total_price ?? 0));
    }
    const revenueTimeSeries = Array.from(revenueMap.entries()).map(
      ([date, revenue]) => ({ date, revenue: Math.round(revenue * 100) / 100 })
    );

    // Bookings by accommodation
    const byAccommodationRaw = await prisma.bookings.groupBy({
      by: ["accommodation"],
      _count: { id: true },
      _sum: { total_price: true },
      where: whereClause,
    });
    const byAccommodation = byAccommodationRaw.map(
      (row: { accommodation: string; _count: { id: number }; _sum: { total_price: unknown } }) => ({
        accommodation: row.accommodation,
        bookings: row._count.id,
        revenue: Number(row._sum.total_price ?? 0),
      })
    );

    // Bookings by source
    const bySourceRaw = await prisma.bookings.groupBy({
      by: ["booking_source"],
      _count: { id: true },
      _sum: { total_price: true },
      where: whereClause,
    });
    const bySource = bySourceRaw.map(
      (row: { booking_source: string | null; _count: { id: number }; _sum: { total_price: unknown } }) => ({
        source: row.booking_source ?? "unknown",
        bookings: row._count.id,
        revenue: Number(row._sum.total_price ?? 0),
      })
    );

    return NextResponse.json({
      summary,
      revenueTimeSeries,
      byAccommodation,
      bySource,
    });
  });
}

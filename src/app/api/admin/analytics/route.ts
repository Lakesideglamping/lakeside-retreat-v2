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

    // Exclude refunded bookings from revenue aggregates — a refund reverses
    // the transaction on Stripe, so it shouldn't count toward earnings.
    const whereClause = {
      deleted_at: null,
      status: { in: ["confirmed", "completed"] },
      payment_status: { not: "refunded" as const },
      created_at: { gte: startDate, lte: endDate },
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
      prisma.$queryRaw<Array<{ total_nights: bigint | null }>>`
        SELECT COALESCE(SUM(GREATEST(check_out - check_in, 0)), 0)::bigint AS total_nights
        FROM bookings
        WHERE deleted_at IS NULL
          AND status IN ('confirmed', 'completed')
          AND created_at >= ${startDate}
          AND created_at <= ${endDate}
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

    // Revenue time series - query bookings and group in JS for date formatting
    const timeSeriesBookings = await prisma.bookings.findMany({
      where: whereClause,
      select: {
        created_at: true,
        total_price: true,
      },
      orderBy: { created_at: "asc" },
    });

    const revenueMap = new Map<string, number>();
    for (const b of timeSeriesBookings) {
      if (!b.created_at) continue;
      const key = formatDateKey(new Date(b.created_at), dateRange);
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

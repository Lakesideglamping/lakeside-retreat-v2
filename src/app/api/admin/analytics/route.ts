import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/admin-route";
import { prisma } from "@/lib/db";

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

    const whereClause = {
      deleted_at: null,
      status: { in: ["confirmed", "completed"] },
      created_at: { gte: startDate, lte: endDate },
    };

    // Summary stats
    const [aggregateResult, bookingCount, allAccommodationBookings] =
      await Promise.all([
        prisma.bookings.aggregate({
          _sum: { total_price: true },
          _avg: { total_price: true },
          where: whereClause,
        }),
        prisma.bookings.count({ where: whereClause }),
        prisma.bookings.findMany({
          where: whereClause,
          select: {
            total_price: true,
            check_in: true,
            check_out: true,
          },
        }),
      ]);

    // Calculate occupancy rate (based on total possible nights in range)
    const totalDaysInRange = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const accommodationCount = 3; // Dome Pinot, Dome Rose, Lakeside Cottage
    const totalPossibleNights = totalDaysInRange * accommodationCount;
    const totalBookedNights = allAccommodationBookings.reduce(
      (acc: number, b: { check_in: Date; check_out: Date }) => {
        const checkIn = new Date(b.check_in);
        const checkOut = new Date(b.check_out);
        const nights = Math.ceil(
          (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
        );
        return acc + Math.max(0, nights);
      },
      0
    );
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

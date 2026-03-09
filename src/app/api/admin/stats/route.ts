import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/admin-route";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  return withAdmin(request, async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    const [
      totalBookings,
      confirmedBookings,
      pendingBookings,
      totalRevenueResult,
      monthRevenueResult,
      todayCheckIns,
      todayCheckOuts,
      recentBookings,
    ] = await Promise.all([
      prisma.bookings.count({
        where: { deleted_at: null },
      }),
      prisma.bookings.count({
        where: { deleted_at: null, status: "confirmed" },
      }),
      prisma.bookings.count({
        where: { deleted_at: null, status: "pending" },
      }),
      prisma.bookings.aggregate({
        _sum: { total_price: true },
        where: {
          deleted_at: null,
          status: { in: ["confirmed", "completed"] },
        },
      }),
      prisma.bookings.aggregate({
        _sum: { total_price: true },
        where: {
          deleted_at: null,
          status: { in: ["confirmed", "completed"] },
          created_at: { gte: monthStart, lt: monthEnd },
        },
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
      prisma.bookings.findMany({
        where: { deleted_at: null },
        select: {
          id: true,
          guest_name: true,
          accommodation: true,
          check_in: true,
          check_out: true,
          status: true,
          total_price: true,
        },
        orderBy: [{ check_in: "desc" }, { created_at: "desc" }],
        take: 5,
      }),
    ]);

    return NextResponse.json({
      totalBookings,
      confirmedBookings,
      pendingBookings,
      totalRevenue: Number(totalRevenueResult._sum.total_price ?? 0),
      monthRevenue: Number(monthRevenueResult._sum.total_price ?? 0),
      todayCheckIns,
      todayCheckOuts,
      recentBookings: recentBookings.map((b) => ({
        id: b.id,
        guest_name: b.guest_name,
        accommodation: b.accommodation,
        check_in: b.check_in.toISOString(),
        check_out: b.check_out.toISOString(),
        status: b.status ?? "confirmed",
        total_price: b.total_price ? Number(b.total_price) : null,
      })),
    });
  });
}

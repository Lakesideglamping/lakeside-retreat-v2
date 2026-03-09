import { prisma } from "@/lib/db";
import { DashboardContent } from "@/components/admin/dashboard-content";

export default async function AdminDashboardPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1);

  const twentyFourHoursAgo = new Date(today.getTime() - 24 * 60 * 60 * 1000);

  const [
    totalBookings,
    confirmedBookings,
    pendingBookings,
    totalRevenueResult,
    monthRevenueResult,
    todayCheckIns,
    todayCheckOuts,
    recentBookings,
    failedPayments,
    syncFailures,
    recentMessages,
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
      where: {
        deleted_at: null,
        check_out: { gte: new Date() },
      },
      select: {
        id: true,
        guest_name: true,
        accommodation: true,
        check_in: true,
        check_out: true,
        status: true,
        total_price: true,
      },
      orderBy: { check_in: "asc" },
      take: 5,
    }),
    prisma.bookings.count({
      where: { deleted_at: null, payment_status: "failed" },
    }),
    prisma.bookings.count({
      where: { deleted_at: null, uplisting_sync_status: "failed" },
    }),
    prisma.contact_messages.count({
      where: { created_at: { gte: twentyFourHoursAgo } },
    }),
  ]);

  const stats = {
    totalBookings,
    confirmedBookings,
    pendingBookings,
    totalRevenue: Number(totalRevenueResult._sum.total_price ?? 0),
    monthRevenue: Number(monthRevenueResult._sum.total_price ?? 0),
    todayCheckIns,
    todayCheckOuts,
  };

  const notifications = {
    failedPayments,
    syncFailures,
    pendingBookings,
    todayCheckIns,
    todayCheckOuts,
    recentMessages,
  };

  const serializedBookings = recentBookings.map((b) => ({
    id: b.id,
    guest_name: b.guest_name,
    accommodation: b.accommodation,
    check_in: b.check_in.toISOString(),
    check_out: b.check_out.toISOString(),
    status: b.status ?? "confirmed",
    total_price: b.total_price ? Number(b.total_price) : null,
  }));

  return (
    <DashboardContent
      stats={stats}
      recentBookings={serializedBookings}
      notifications={notifications}
    />
  );
}

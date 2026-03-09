import { prisma } from "@/lib/db";
import { DashboardContent } from "@/components/admin/dashboard-content";

export default async function AdminDashboardPage() {
  // Use NZ timezone for "today" since the server runs in UTC
  const nzParts = new Intl.DateTimeFormat("en-NZ", {
    timeZone: "Pacific/Auckland",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const nzYear = Number(nzParts.find((p) => p.type === "year")!.value);
  const nzMonth = Number(nzParts.find((p) => p.type === "month")!.value) - 1;
  const nzDay = Number(nzParts.find((p) => p.type === "day")!.value);

  const today = new Date(Date.UTC(nzYear, nzMonth, nzDay));
  const tomorrow = new Date(Date.UTC(nzYear, nzMonth, nzDay + 1));

  const monthStart = new Date(Date.UTC(nzYear, nzMonth, 1));
  const monthEnd = new Date(Date.UTC(nzYear, nzMonth + 1, 1));

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
        check_out: { gte: today },
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

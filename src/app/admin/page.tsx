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
  const prevMonthStart = new Date(Date.UTC(nzYear, nzMonth - 1, 1));

  // 7-day occupancy window starts tonight and covers the next 7 nights
  const sevenDaysOut = new Date(Date.UTC(nzYear, nzMonth, nzDay + 7));

  const twentyFourHoursAgo = new Date(today.getTime() - 24 * 60 * 60 * 1000);

  // Revenue queries exclude refunded bookings — a refund reverses the
  // transaction in Stripe, so counting it as revenue overstates earnings.
  const revenueWhere = {
    deleted_at: null,
    status: { in: ["confirmed", "completed"] },
    payment_status: { not: "refunded" as const },
  };

  const [
    totalBookings,
    confirmedBookings,
    pendingBookings,
    totalRevenueResult,
    monthRevenueResult,
    todayArrivals,
    todayDepartures,
    inHouseNow,
    upcomingStays,
    failedPayments,
    syncFailures,
    recentMessages,
    propertyRevenueThisMonth,
    propertyRevenuePrevMonth,
    failedWebhooks,
    sevenDayBooked,
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
      where: revenueWhere,
    }),
    // Month revenue keyed on stay date (check_in) to match the Analytics page
    // and answer "what's this month's stays worth?" rather than "what landed
    // in my inbox this month?".
    prisma.bookings.aggregate({
      _sum: { total_price: true },
      where: {
        ...revenueWhere,
        check_in: { gte: monthStart, lt: monthEnd },
      },
    }),
    // Today's arrivals — the actionable list (who's turning up, what phone)
    prisma.bookings.findMany({
      where: {
        deleted_at: null,
        status: { in: ["confirmed", "completed"] },
        check_in: { gte: today, lt: tomorrow },
      },
      select: {
        id: true,
        guest_name: true,
        guest_phone: true,
        accommodation: true,
        guests: true,
      },
      orderBy: { accommodation: "asc" },
    }),
    // Today's departures — for cleaning/turnover planning
    prisma.bookings.findMany({
      where: {
        deleted_at: null,
        status: { in: ["confirmed", "completed"] },
        check_out: { gte: today, lt: tomorrow },
      },
      select: {
        id: true,
        guest_name: true,
        accommodation: true,
      },
      orderBy: { accommodation: "asc" },
    }),
    // In-house tonight — currently on-property
    prisma.bookings.count({
      where: {
        deleted_at: null,
        status: { in: ["confirmed", "completed"] },
        check_in: { lte: today },
        check_out: { gt: today },
      },
    }),
    // Upcoming stays list — next arrivals
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
    // Per-property revenue — keyed on stay date to match Analytics
    prisma.bookings.groupBy({
      by: ["accommodation"],
      _sum: { total_price: true },
      where: {
        ...revenueWhere,
        check_in: { gte: monthStart, lt: monthEnd },
      },
    }),
    prisma.bookings.groupBy({
      by: ["accommodation"],
      _sum: { total_price: true },
      where: {
        ...revenueWhere,
        check_in: { gte: prevMonthStart, lt: monthStart },
      },
    }),
    prisma.failed_webhook_events.count({ where: { resolved: false } }),
    // Next-7-days booked-nights across all properties. Clip each booking's
    // stay to the 7-day window, sum GREATEST(... , 0) so nights outside the
    // window (or zero-length quirks) don't contribute.
    prisma.$queryRaw<Array<{ nights: bigint | null }>>`
      SELECT COALESCE(SUM(
        GREATEST(
          LEAST(check_out, ${sevenDaysOut}::timestamp) -
          GREATEST(check_in, ${today}::timestamp),
          0
        )
      ), 0)::bigint AS nights
      FROM bookings
      WHERE deleted_at IS NULL
        AND status IN ('confirmed', 'completed')
        AND check_in < ${sevenDaysOut}
        AND check_out > ${today}
    `,
  ]);

  const PROPERTIES = [
    { id: "dome-pinot", label: "Dome Pinot" },
    { id: "dome-rose", label: "Dome Rosé" },
    { id: "lakeside-cottage", label: "Lakeside Cottage" },
  ];

  const propertyRevenue = PROPERTIES.map((p) => {
    const curr = Number(
      propertyRevenueThisMonth.find((r) => r.accommodation === p.id)?._sum.total_price ?? 0
    );
    const prev = Number(
      propertyRevenuePrevMonth.find((r) => r.accommodation === p.id)?._sum.total_price ?? 0
    );
    const delta = prev === 0 ? null : ((curr - prev) / prev) * 100;
    return { id: p.id, label: p.label, current: curr, previous: prev, deltaPct: delta };
  });

  const totalPossibleNights = 7 * PROPERTIES.length;
  const bookedNights = Number(sevenDayBooked[0]?.nights ?? 0);
  const sevenDayOccupancyPct =
    totalPossibleNights > 0
      ? Math.round((bookedNights / totalPossibleNights) * 100)
      : 0;

  const stats = {
    totalBookings,
    confirmedBookings,
    pendingBookings,
    totalRevenue: Number(totalRevenueResult._sum.total_price ?? 0),
    monthRevenue: Number(monthRevenueResult._sum.total_price ?? 0),
    todayArrivalCount: todayArrivals.length,
    todayDepartureCount: todayDepartures.length,
    inHouseNow,
    sevenDayOccupancyPct,
    sevenDayBookedNights: bookedNights,
    sevenDayTotalNights: totalPossibleNights,
  };

  const notifications = {
    failedPayments,
    syncFailures,
    pendingBookings,
    recentMessages,
    failedWebhooks,
  };

  const serializedUpcoming = upcomingStays.map((b) => ({
    id: b.id,
    guest_name: b.guest_name,
    accommodation: b.accommodation,
    check_in: b.check_in.toISOString(),
    check_out: b.check_out.toISOString(),
    status: b.status ?? "confirmed",
    total_price: b.total_price ? Number(b.total_price) : null,
  }));

  const serializedArrivals = todayArrivals.map((b) => ({
    id: b.id,
    guest_name: b.guest_name,
    guest_phone: b.guest_phone,
    accommodation: b.accommodation,
    guests: b.guests ?? null,
  }));

  const serializedDepartures = todayDepartures.map((b) => ({
    id: b.id,
    guest_name: b.guest_name,
    accommodation: b.accommodation,
  }));

  return (
    <DashboardContent
      stats={stats}
      upcomingStays={serializedUpcoming}
      todayArrivals={serializedArrivals}
      todayDepartures={serializedDepartures}
      notifications={notifications}
      propertyRevenue={propertyRevenue}
    />
  );
}

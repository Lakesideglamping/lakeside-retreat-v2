import { prisma } from "@/lib/db";
import { CalendarView } from "@/components/admin/calendar/calendar-view";

export default async function CalendarPage() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  // Extend range to cover partial weeks at month boundaries
  const rangeStart = new Date(monthStart);
  rangeStart.setDate(rangeStart.getDate() - 7);
  const rangeEnd = new Date(monthEnd);
  rangeEnd.setDate(rangeEnd.getDate() + 7);

  const [blockedDates, bookings] = await Promise.all([
    prisma.blocked_dates.findMany({
      where: {
        OR: [
          { start_date: { gte: rangeStart, lte: rangeEnd } },
          { end_date: { gte: rangeStart, lte: rangeEnd } },
          {
            AND: [
              { start_date: { lte: rangeStart } },
              { end_date: { gte: rangeEnd } },
            ],
          },
        ],
      },
      orderBy: { start_date: "asc" },
    }),
    prisma.bookings.findMany({
      where: {
        deleted_at: null,
        status: { in: ["confirmed", "pending", "completed"] },
        OR: [
          { check_in: { gte: rangeStart, lte: rangeEnd } },
          { check_out: { gte: rangeStart, lte: rangeEnd } },
          {
            AND: [
              { check_in: { lte: rangeStart } },
              { check_out: { gte: rangeEnd } },
            ],
          },
        ],
      },
      select: {
        id: true,
        guest_name: true,
        accommodation: true,
        check_in: true,
        check_out: true,
        status: true,
      },
      orderBy: { check_in: "asc" },
    }),
  ]);

  const serializedBlocked = blockedDates.map((b) => ({
    id: b.id,
    property: b.property,
    start_date: b.start_date.toISOString().split("T")[0],
    end_date: b.end_date.toISOString().split("T")[0],
    reason: b.reason,
    notes: b.notes,
  }));

  const serializedBookings = bookings.map((b) => ({
    id: b.id,
    guest_name: b.guest_name,
    accommodation: b.accommodation,
    check_in: b.check_in.toISOString().split("T")[0],
    check_out: b.check_out.toISOString().split("T")[0],
    status: b.status,
  }));

  return (
    <CalendarView
      initialBlockedDates={serializedBlocked}
      initialBookings={serializedBookings}
      initialYear={now.getFullYear()}
      initialMonth={now.getMonth()}
    />
  );
}

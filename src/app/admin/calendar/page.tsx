import { prisma } from "@/lib/db";
import { CalendarView } from "@/components/admin/calendar/calendar-view";
import { fetchBlockedDates } from "@/lib/uplisting";

const PROPERTIES = ["dome-pinot", "dome-rose", "lakeside-cottage"] as const;

function groupConsecutiveDates(dates: string[]): Array<{ from: string; to: string }> {
  if (dates.length === 0) return [];
  const sorted = [...dates].sort();
  const ranges: Array<{ from: string; to: string }> = [];
  let rangeStart = sorted[0];
  let rangeEnd = sorted[0];
  for (let i = 1; i < sorted.length; i++) {
    const curr = sorted[i];
    const next = new Date(rangeEnd);
    next.setDate(next.getDate() + 1);
    if (next.toISOString().split("T")[0] === curr) {
      rangeEnd = curr;
    } else {
      ranges.push({ from: rangeStart, to: rangeEnd });
      rangeStart = curr;
      rangeEnd = curr;
    }
  }
  ranges.push({ from: rangeStart, to: rangeEnd });
  return ranges;
}

export default async function CalendarPage() {
  const nzParts = new Intl.DateTimeFormat("en-NZ", {
    timeZone: "Pacific/Auckland",
    year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const nzYear = Number(nzParts.find((p) => p.type === "year")!.value);
  const nzMonth = Number(nzParts.find((p) => p.type === "month")!.value) - 1;

  const rangeStart = new Date(Date.UTC(nzYear, nzMonth - 1, 1));
  const rangeEnd = new Date(Date.UTC(nzYear, nzMonth + 4, 0));

  const [blockedDates, bookings] = await Promise.all([
    prisma.blocked_dates.findMany({
      where: {
        OR: [
          { start_date: { gte: rangeStart, lte: rangeEnd } },
          { end_date: { gte: rangeStart, lte: rangeEnd } },
          { AND: [{ start_date: { lte: rangeStart } }, { end_date: { gte: rangeEnd } }] },
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
          { AND: [{ check_in: { lte: rangeStart } }, { check_out: { gte: rangeEnd } }] },
        ],
      },
      select: {
        id: true,
        guest_name: true,
        accommodation: true,
        check_in: true,
        check_out: true,
        status: true,
        booking_source: true,
      },
      orderBy: { check_in: "asc" },
    }),
  ]);

  // If Uplisting is down or misconfigured we still render the page, but we
  // capture per-property failure so the UI can surface a banner — silently
  // swallowing here made operators think the PMS calendar was empty when it
  // wasn't.
  const uplistingResults = await Promise.all(
    PROPERTIES.map(async (p) => {
      try {
        return { ok: true as const, dates: await fetchBlockedDates(p) };
      } catch (err) {
        console.error(`[calendar] fetchBlockedDates(${p}) failed`, err);
        return { ok: false as const, dates: [] as string[] };
      }
    })
  );
  const uplistingBlockedArrays = uplistingResults.map((r) => r.dates);
  const uplistingFetchFailed = uplistingResults.some((r) => !r.ok);

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
    booking_source: b.booking_source ?? null,
  }));

  const initialUplistingBlocked: Record<string, Array<{ from: string; to: string }>> = {};
  PROPERTIES.forEach((prop, i) => {
    initialUplistingBlocked[prop] = groupConsecutiveDates(uplistingBlockedArrays[i]);
  });

  return (
    <CalendarView
      initialBlockedDates={serializedBlocked}
      initialBookings={serializedBookings}
      initialYear={nzYear}
      initialMonth={nzMonth}
      initialUplistingBlocked={initialUplistingBlocked}
      uplistingFetchFailed={uplistingFetchFailed}
    />
  );
}

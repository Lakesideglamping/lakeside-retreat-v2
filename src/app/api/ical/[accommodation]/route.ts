import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const ACCOMMODATION_NAMES: Record<string, string> = {
  "dome-pinot": "Lakeside Glamping - Dome Pinot",
  "dome-rose": "Lakeside Glamping - Dome Rosé",
  "lakeside-cottage": "Lakeside Retreat in a Vineyard By Lake Dunstan",
};

function formatICalDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function escapeICalText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ accommodation: string }> }
) {
  const { accommodation } = await params;

  if (!ACCOMMODATION_NAMES[accommodation]) {
    return new NextResponse("Not found", { status: 404 });
  }

  const bookings = await prisma.bookings.findMany({
    where: {
      accommodation,
      status: { in: ["confirmed", "completed"] },
      booking_source: "website",
      check_out: { gte: new Date() },
    },
    select: {
      id: true,
      guest_name: true,
      check_in: true,
      check_out: true,
      guests: true,
      created_at: true,
    },
    orderBy: { check_in: "asc" },
  });

  const propertyName = ACCOMMODATION_NAMES[accommodation];
  const now = formatICalDate(new Date());

  const events = bookings
    .map((b) => {
      const uid = `${b.id}@lakesideretreat.co.nz`;
      const dtstart = formatICalDate(new Date(b.check_in));
      const dtend = formatICalDate(new Date(b.check_out));
      const created = b.created_at ? formatICalDate(new Date(b.created_at)) : now;
      const summary = escapeICalText(`Website Booking - ${b.guest_name}`);
      const description = escapeICalText(
        `Direct booking via Lakeside Retreat website. Guests: ${b.guests}`
      );

      return [
        "BEGIN:VEVENT",
        `UID:${uid}`,
        `DTSTAMP:${now}`,
        `DTSTART:${dtstart}`,
        `DTEND:${dtend}`,
        `CREATED:${created}`,
        `SUMMARY:${summary}`,
        `DESCRIPTION:${description}`,
        "STATUS:CONFIRMED",
        "END:VEVENT",
      ].join("\r\n");
    })
    .join("\r\n");

  const calendar = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Lakeside Retreat//Direct Bookings//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeICalText(propertyName)} - Direct Bookings`,
    "X-WR-TIMEZONE:Pacific/Auckland",
    events,
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");

  return new NextResponse(calendar, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${accommodation}.ics"`,
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}

import { withAdmin } from "@/lib/admin-route";
import { prisma } from "@/lib/db";
import { getValidIds } from "@/lib/accommodations";

// Match the allowlist used by the list endpoint so unknown filter values
// either return 0 rows (obvious bug) or are ignored, rather than silently
// querying on arbitrary strings.
const VALID_BOOKING_STATUSES = new Set([
  "pending",
  "confirmed",
  "cancelled",
  "completed",
]);
// Source is left open-ended — PMS imports bring in values we don't control
// (airbnb, booking.com, etc.). Shape-match instead of allowlisting.
const SOURCE_SHAPE = /^[A-Za-z0-9._-]{1,50}$/;

function escapeCsvValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildBookingFilters(url: URL): Record<string, unknown> {
  const status = url.searchParams.get("status");
  const search = url.searchParams.get("search");
  const accommodation = url.searchParams.get("accommodation");
  const dateFrom = url.searchParams.get("dateFrom");
  const dateTo = url.searchParams.get("dateTo");
  const source = url.searchParams.get("source");

  const where: Record<string, unknown> = {
    deleted_at: null,
  };

  if (status && VALID_BOOKING_STATUSES.has(status)) where.status = status;
  if (accommodation && getValidIds().includes(accommodation)) {
    where.accommodation = accommodation;
  }
  if (source && SOURCE_SHAPE.test(source)) where.booking_source = source;

  if (search && search.length <= 100) {
    where.OR = [
      { guest_name: { contains: search, mode: "insensitive" } },
      { guest_email: { contains: search, mode: "insensitive" } },
    ];
  }

  // Only accept YYYY-MM-DD date strings; anything else is ignored so a bad
  // query string can't produce an Invalid Date that Prisma rejects at runtime.
  const DATE_SHAPE = /^\d{4}-\d{2}-\d{2}$/;
  if ((dateFrom && DATE_SHAPE.test(dateFrom)) || (dateTo && DATE_SHAPE.test(dateTo))) {
    const checkIn: Record<string, Date> = {};
    if (dateFrom && DATE_SHAPE.test(dateFrom)) checkIn.gte = new Date(dateFrom);
    if (dateTo && DATE_SHAPE.test(dateTo)) checkIn.lte = new Date(dateTo);
    where.check_in = checkIn;
  }

  return where;
}

// Hard cap on export size to prevent runaway memory use on large result sets.
// Admins who need more should filter by date range.
const EXPORT_LIMIT = 5000;

export async function GET(request: Request) {
  return withAdmin(request, async (_admin, req) => {
    const url = new URL(req.url);
    const where = buildBookingFilters(url);

    const bookings = await prisma.bookings.findMany({
      where,
      orderBy: { created_at: "desc" },
      take: EXPORT_LIMIT,
    });

    const headers = [
      "ID",
      "Guest Name",
      "Email",
      "Accommodation",
      "Check In",
      "Check Out",
      "Guests",
      "Total",
      "Status",
      "Payment Status",
      "Source",
      "Created",
    ];

    const rows = bookings.map((b) => [
      escapeCsvValue(b.id),
      escapeCsvValue(b.guest_name),
      escapeCsvValue(b.guest_email),
      escapeCsvValue(b.accommodation),
      escapeCsvValue(b.check_in.toISOString().split("T")[0]),
      escapeCsvValue(b.check_out.toISOString().split("T")[0]),
      escapeCsvValue(b.guests),
      escapeCsvValue(b.total_price != null ? String(b.total_price) : ""),
      escapeCsvValue(b.status),
      escapeCsvValue(b.payment_status),
      escapeCsvValue(b.booking_source ?? "unknown"),
      escapeCsvValue(b.created_at?.toISOString().split("T")[0] ?? ""),
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row: string[]) => row.join(",")),
    ].join("\n");

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="bookings-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  });
}

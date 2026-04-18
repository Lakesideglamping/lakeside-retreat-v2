import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { randomUUID } from "crypto";
import { withAdminMutation, getClientIp } from "@/lib/admin-route";
import { auditLog } from "@/lib/audit";

const API_BASE = "https://connect.uplisting.io";

const PROPERTIES = [
  { slug: "dome-pinot", id: process.env.UPLISTING_PINOT_ID },
  { slug: "dome-rose", id: process.env.UPLISTING_ROSE_ID },
  { slug: "lakeside-cottage", id: process.env.UPLISTING_COTTAGE_ID },
];

function authHeader(): string {
  const key = process.env.UPLISTING_API_KEY;
  if (!key) return "";
  return `Basic ${Buffer.from(key).toString("base64")}`;
}

export async function POST(request: Request) {
  return withAdminMutation(request, async (admin, req) => {
    if (!process.env.UPLISTING_API_KEY) {
      return NextResponse.json({ error: "Uplisting not configured" }, { status: 500 });
    }

    const results: { property: string; imported: number; skipped: number; errors: number }[] = [];

    for (const prop of PROPERTIES) {
      let imported = 0;
      let skipped = 0;
      let errors = 0;

      if (!prop.id) {
        results.push({ property: prop.slug, imported: 0, skipped: 0, errors: 1 });
        continue;
      }

      try {
        const res = await fetch(`${API_BASE}/bookings/${prop.id}`, {
          headers: {
            Authorization: authHeader(),
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          console.error(`[import] Failed to fetch bookings for ${prop.slug}: ${res.status}`);
          results.push({ property: prop.slug, imported: 0, skipped: 0, errors: 1 });
          continue;
        }

        const data = await res.json();
        const bookings = data.bookings || data.data || data || [];
        const bookingList = Array.isArray(bookings) ? bookings : [];

        for (const b of bookingList) {
          const uplistingId = String(b.id || "");
          if (!uplistingId) continue;

          const source = b.channel || b.source || "channel";
          const guestName = b.guest_name || b.guest?.name || "Channel Guest";
          const guestEmail = b.guest_email || b.guest?.email || "";
          const guestPhone = b.guest_phone || b.guest?.phone || null;
          const bookingData = {
            guest_name: guestName,
            guest_email: guestEmail,
            guest_phone: guestPhone,
            accommodation: prop.slug,
            check_in: new Date(b.check_in),
            check_out: new Date(b.check_out),
            guests: Number(b.number_of_guests || b.guests) || 1,
            total_price: b.total_payout
              ? Number(b.total_payout)
              : b.accomodation_total
                ? Number(b.accomodation_total)
                : b.total
                  ? Number(b.total)
                  : null,
            status: b.status === "cancelled" ? "cancelled" : "confirmed",
            payment_status: "paid_external",
            booking_source:
              source.startsWith("airbnb")
                ? "airbnb"
                : source.startsWith("booking")
                  ? "booking.com"
                  : source === "direct" || source === "uplisting"
                    ? "direct"
                    : `channel:${source}`,
            uplisting_id: uplistingId,
            uplisting_sync_status: "synced",
            security_deposit_status: "not_applicable",
          };

          try {
            const existing = await prisma.bookings.findFirst({
              where: { uplisting_id: uplistingId },
            });

            if (existing) {
              await prisma.bookings.update({
                where: { id: existing.id },
                data: bookingData,
              });
              skipped++; // count as "updated"
            } else {
              await prisma.bookings.create({
                data: { id: randomUUID(), ...bookingData },
              });
              imported++;
            }
          } catch (dbErr) {
            console.error(`[import] DB error for booking ${uplistingId}:`, dbErr);
            errors++;
          }
        }
      } catch (err) {
        console.error(`[import] Error fetching ${prop.slug}:`, err);
        errors++;
      }

      results.push({ property: prop.slug, imported, skipped, errors });
    }

    const ip = getClientIp(req);
    await auditLog(admin.username, "bookings_imported", { results }, ip);

    return NextResponse.json({ results });
  });
}

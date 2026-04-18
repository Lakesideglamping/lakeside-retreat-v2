import { NextResponse } from "next/server";
import { verifyWebhookSignature, isConfigured } from "@/lib/uplisting";
import { prisma } from "@/lib/db";
import { randomUUID } from "crypto";

// Map Uplisting property IDs back to our accommodation slugs.
// No fallback values — if the env vars are missing we fail closed rather than
// silently routing events to hardcoded live property IDs, which would corrupt
// data on any environment that doesn't have these vars set.
function buildPropertySlugMap(): Record<string, string> {
  const map: Record<string, string> = {};
  if (process.env.UPLISTING_PINOT_ID) map[process.env.UPLISTING_PINOT_ID] = "dome-pinot";
  if (process.env.UPLISTING_ROSE_ID) map[process.env.UPLISTING_ROSE_ID] = "dome-rose";
  if (process.env.UPLISTING_COTTAGE_ID) map[process.env.UPLISTING_COTTAGE_ID] = "lakeside-cottage";
  return map;
}

const PROPERTY_SLUG_MAP = buildPropertySlugMap();

function getAccommodationSlug(propertyId: string | number): string {
  return PROPERTY_SLUG_MAP[String(propertyId)] || "unknown";
}

/**
 * Normalize a date string into a UTC midnight Date — matches how Prisma
 * stores DATE columns. Accepts YYYY-MM-DD, ISO timestamps, or anything
 * `new Date()` can parse. Returns null for invalid input.
 */
function toUtcMidnight(value: unknown): Date | null {
  if (!value) return null;
  const str = String(value);
  const ymd = str.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
  const d = new Date(`${ymd}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function POST(request: Request) {
  if (!isConfigured()) {
    return NextResponse.json({ received: true, devMode: true });
  }

  try {
    const body = await request.text();
    const signature = request.headers.get("x-uplisting-signature") || "";

    // Require the shared secret in production — fail closed if unset.
    // This prevents an attacker from POSTing fake bookings when the secret
    // is accidentally removed or never configured.
    if (!process.env.UPLISTING_WEBHOOK_SECRET) {
      console.error(
        "[uplisting webhook] UPLISTING_WEBHOOK_SECRET is not set — rejecting request"
      );
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 }
      );
    }

    const valid = verifyWebhookSignature(body, signature);
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    // Uplisting webhook payload is a flat booking object POSTed directly.
    // Event type comes from the ?event= query param since all hooks share one URL.
    const url = new URL(request.url);
    const eventType = url.searchParams.get("event") || "unknown";
    const data = JSON.parse(body);
    const uplistingId = String(data.id || "");

    console.log("[uplisting webhook] Event:", eventType, "ID:", uplistingId);

    switch (eventType) {
      case "booking_created": {
        const propertyId = String(data.property_id || "");
        const accommodation = getAccommodationSlug(propertyId);
        const source = String(data.channel || data.source || "channel").toLowerCase();
        const checkIn = toUtcMidnight(data.check_in);
        const checkOut = toUtcMidnight(data.check_out);

        // Skip if this booking already exists (dedup by uplisting_id)
        if (uplistingId) {
          const existing = await prisma.bookings.findFirst({
            where: { uplisting_id: uplistingId },
          });
          if (existing) {
            console.log(
              `[uplisting webhook] Booking ${uplistingId} already exists, skipping`
            );
            break;
          }
        }

        // If this is a direct booking coming back from Uplisting (because we
        // pushed it there ourselves), link it to the existing website booking
        // instead of creating a duplicate. Uplisting returns direct bookings
        // with source "direct" — accept legacy "uplisting" for safety.
        const isDirect = source === "direct" || source === "uplisting" || source === "website";
        if (isDirect && checkIn && checkOut) {
          const matchingBooking = await prisma.bookings.findFirst({
            where: {
              accommodation,
              check_in: checkIn,
              check_out: checkOut,
              booking_source: "website",
              uplisting_sync_status: { in: ["synced", "pending"] },
            },
          });
          if (matchingBooking) {
            await prisma.bookings.update({
              where: { id: matchingBooking.id },
              data: {
                uplisting_id: uplistingId,
                uplisting_sync_status: "synced",
                updated_at: new Date(),
              },
            });
            console.log(
              `[uplisting webhook] Linked direct booking ${matchingBooking.id} to Uplisting ${uplistingId}`
            );
            break;
          }
        }

        // Create a new booking from external channel (Airbnb, Booking.com, etc.)
        const guestName = data.guest_name || "Channel Guest";

        if (!checkIn || !checkOut) {
          console.error(
            `[uplisting webhook] Missing/invalid dates for booking ${uplistingId}`,
            { check_in: data.check_in, check_out: data.check_out }
          );
          return NextResponse.json(
            { error: "Invalid check_in/check_out" },
            { status: 400 }
          );
        }

        try {
          await prisma.bookings.create({
            data: {
              id: randomUUID(),
              guest_name: guestName,
              guest_email: data.guest_email || "",
              guest_phone: data.guest_phone || null,
              accommodation,
              check_in: checkIn,
              check_out: checkOut,
              guests: Number(data.number_of_guests) || 1,
              total_price: data.total_payout
                ? Number(data.total_payout)
                : data.accomodation_total
                  ? Number(data.accomodation_total)
                  : null,
              status: data.status === "cancelled" ? "cancelled" : "confirmed",
              payment_status: "paid_external",
              booking_source: source.startsWith("airbnb")
                ? "airbnb"
                : source.startsWith("booking")
                  ? "booking.com"
                  : `channel:${source}`,
              uplisting_id: uplistingId,
              uplisting_sync_status: "synced",
              security_deposit_status: "not_applicable",
            },
          });
          console.log(
            `[uplisting webhook] Created channel booking: ${guestName} at ${accommodation} (${source})`
          );
        } catch (dbErr) {
          console.error("[uplisting webhook] DB create error:", dbErr);
          throw dbErr; // let outer catch return 500 so Uplisting retries
        }
        break;
      }

      case "booking_updated": {
        if (!uplistingId) break;

        try {
          const updateData: Record<string, unknown> = {
            updated_at: new Date(),
          };

          const newCheckIn = toUtcMidnight(data.check_in);
          const newCheckOut = toUtcMidnight(data.check_out);
          if (newCheckIn) updateData.check_in = newCheckIn;
          if (newCheckOut) updateData.check_out = newCheckOut;
          if (data.number_of_guests)
            updateData.guests = Number(data.number_of_guests);
          if (data.guest_name)
            updateData.guest_name = data.guest_name;
          if (data.guest_email)
            updateData.guest_email = data.guest_email;
          if (data.total_payout)
            updateData.total_price = Number(data.total_payout);
          if (data.status === "cancelled")
            updateData.status = "cancelled";

          const result = await prisma.bookings.updateMany({
            where: { uplisting_id: uplistingId },
            data: updateData,
          });

          console.log(
            `[uplisting webhook] Updated booking ${uplistingId}: ${result.count} row(s)`
          );
        } catch (dbErr) {
          console.error("[uplisting webhook] DB update error:", dbErr);
          throw dbErr;
        }
        break;
      }

      case "booking_removed": {
        if (!uplistingId) break;

        try {
          const result = await prisma.bookings.updateMany({
            where: { uplisting_id: uplistingId },
            data: {
              status: "cancelled",
              updated_at: new Date(),
            },
          });

          console.log(
            `[uplisting webhook] Cancelled booking ${uplistingId}: ${result.count} row(s)`
          );
        } catch (dbErr) {
          console.error(
            "[uplisting webhook] DB cancel error:",
            dbErr
          );
          throw dbErr;
        }
        break;
      }

      default:
        console.log(
          `[uplisting webhook] Unhandled event: ${eventType}`
        );
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    // Return 500 so Uplisting retries transient failures (DB outage etc).
    console.error("[api/uplisting/webhook] Error:", err);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

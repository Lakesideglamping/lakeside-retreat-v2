import { NextResponse } from "next/server";
import { verifyWebhookSignature, isConfigured } from "@/lib/uplisting";
import { prisma } from "@/lib/db";
import { randomUUID } from "crypto";

// Map Uplisting property IDs back to our accommodation slugs
const PROPERTY_SLUG_MAP: Record<string, string> = {
  [process.env.UPLISTING_PINOT_ID || "82753"]: "dome-pinot",
  [process.env.UPLISTING_ROSE_ID || "82754"]: "dome-rose",
  [process.env.UPLISTING_COTTAGE_ID || "80360"]: "lakeside-cottage",
};

function getAccommodationSlug(propertyId: string | number): string {
  return PROPERTY_SLUG_MAP[String(propertyId)] || "unknown";
}

export async function POST(request: Request) {
  if (!isConfigured()) {
    return NextResponse.json({ received: true, devMode: true });
  }

  try {
    const body = await request.text();
    const signature = request.headers.get("x-uplisting-signature") || "";

    if (process.env.UPLISTING_WEBHOOK_SECRET) {
      const valid = verifyWebhookSignature(body, signature);
      if (!valid) {
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 }
        );
      }
    }

    const event = JSON.parse(body);
    const eventType = event.type || "unknown";
    const data = event.data?.attributes || event.data || {};
    const uplistingId = String(
      event.data?.id || data.id || data.booking_id || ""
    );

    console.log("[uplisting webhook] Event:", eventType, "ID:", uplistingId);

    switch (eventType) {
      case "booking.created": {
        const propertyId = String(data.property_id || "");
        const accommodation = getAccommodationSlug(propertyId);
        const source = data.source || data.channel || "channel";

        // Skip if this booking already exists (e.g., we created it via syncBooking)
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

        // Also skip if it was a "direct" booking we pushed to Uplisting
        if (source === "direct") {
          const matchingBooking = await prisma.bookings.findFirst({
            where: {
              accommodation,
              check_in: new Date(data.check_in),
              check_out: new Date(data.check_out),
              booking_source: "website",
              uplisting_sync_status: { in: ["synced", "pending"] },
            },
          });
          if (matchingBooking) {
            // Link our existing booking to the Uplisting ID
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
        const guestName =
          [data.guest_first_name, data.guest_last_name]
            .filter(Boolean)
            .join(" ") || "Channel Guest";

        try {
          await prisma.bookings.create({
            data: {
              id: randomUUID(),
              guest_name: guestName,
              guest_email: data.guest_email || "",
              guest_phone: data.guest_phone || null,
              accommodation,
              check_in: new Date(data.check_in),
              check_out: new Date(data.check_out),
              guests: Number(data.number_of_guests) || 1,
              total_price: data.total_price
                ? Number(data.total_price)
                : null,
              status: "confirmed",
              payment_status: "paid_external",
              booking_source:
                source === "airbnb"
                  ? "airbnb"
                  : source === "booking_com"
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
        }
        break;
      }

      case "booking.updated": {
        if (!uplistingId) break;

        try {
          const updateData: Record<string, unknown> = {
            updated_at: new Date(),
          };

          if (data.check_in)
            updateData.check_in = new Date(data.check_in);
          if (data.check_out)
            updateData.check_out = new Date(data.check_out);
          if (data.number_of_guests)
            updateData.guests = Number(data.number_of_guests);
          if (data.guest_first_name || data.guest_last_name) {
            updateData.guest_name = [
              data.guest_first_name,
              data.guest_last_name,
            ]
              .filter(Boolean)
              .join(" ");
          }
          if (data.guest_email)
            updateData.guest_email = data.guest_email;
          if (data.total_price)
            updateData.total_price = Number(data.total_price);

          const result = await prisma.bookings.updateMany({
            where: { uplisting_id: uplistingId },
            data: updateData,
          });

          console.log(
            `[uplisting webhook] Updated booking ${uplistingId}: ${result.count} row(s)`
          );
        } catch (dbErr) {
          console.error("[uplisting webhook] DB update error:", dbErr);
        }
        break;
      }

      case "booking.cancelled": {
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
    console.error("[api/uplisting/webhook] Error:", err);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 400 }
    );
  }
}

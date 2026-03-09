import { NextResponse } from "next/server";
import { constructWebhookEvent, stripe, isDevMode } from "@/lib/stripe";
import { sendBookingConfirmation } from "@/lib/email";
import { syncBooking } from "@/lib/uplisting";
import { prisma } from "@/lib/db";
import { randomUUID } from "crypto";

export async function POST(request: Request) {
  if (isDevMode) {
    return NextResponse.json({ received: true, devMode: true });
  }

  try {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    const event = constructWebhookEvent(body, signature);

    // Webhook deduplication — skip if already processed
    const existing = await prisma.processed_webhook_events.findUnique({
      where: { event_id: event.id },
    });
    if (existing) {
      console.log(`[stripe webhook] Duplicate event skipped: ${event.id}`);
      return NextResponse.json({ received: true, duplicate: true });
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const metadata = session.metadata || {};

        console.log(
          "[stripe webhook] checkout.session.completed:",
          metadata.accommodation,
          metadata.checkIn,
          "to",
          metadata.checkOut
        );

        // Save booking to database
        const bookingId = randomUUID();
        try {
          await prisma.bookings.create({
            data: {
              id: bookingId,
              guest_name: metadata.guestName || "Guest",
              guest_email: metadata.guestEmail || "",
              guest_phone: metadata.guestPhone || null,
              accommodation: metadata.accommodation || "",
              check_in: new Date(metadata.checkIn),
              check_out: new Date(metadata.checkOut),
              guests: Number(metadata.guests) || 1,
              total_price: (session.amount_total || 0) / 100,
              status: "confirmed",
              payment_status: "paid",
              notes: metadata.specialRequests || null,
              stripe_session_id: session.id,
              stripe_payment_id:
                (session.payment_intent as string) || null,
              booking_source: "website",
              uplisting_sync_status: "pending",
              security_deposit_status: "held",
              security_deposit_amount: Number(
                metadata.securityDeposit || 300
              ),
              security_deposit_intent_id:
                (session.payment_intent as string) || null,
              deposit_release_due: new Date(
                new Date(metadata.checkOut).getTime() +
                  2 * 24 * 60 * 60 * 1000
              ).toISOString(),
            },
          });
          console.log(
            `[stripe webhook] Booking saved to DB: ${bookingId}`
          );
        } catch (dbErr) {
          console.error("[stripe webhook] DB save error:", dbErr);
          // Log to failed_webhook_events for manual resolution
          await prisma.failed_webhook_events
            .create({
              data: {
                event_id: event.id,
                event_type: event.type,
                stripe_session_id: session.id,
                stripe_payment_id:
                  (session.payment_intent as string) || null,
                booking_id: bookingId,
                event_data: JSON.stringify(metadata),
                error_message:
                  dbErr instanceof Error
                    ? dbErr.message
                    : "Unknown DB error",
              },
            })
            .catch((e) =>
              console.error(
                "[stripe webhook] Failed to log error:",
                e
              )
            );
        }

        // Sync booking to Uplisting (non-blocking)
        syncBooking({
          accommodation: metadata.accommodation || "",
          checkIn: metadata.checkIn || "",
          checkOut: metadata.checkOut || "",
          guestName: metadata.guestName || "",
          guestEmail: metadata.guestEmail || "",
          guestPhone: metadata.guestPhone,
          guests: Number(metadata.guests) || 1,
        })
          .then(() => {
            prisma.bookings
              .update({
                where: { id: bookingId },
                data: { uplisting_sync_status: "synced" },
              })
              .catch(() => {});
          })
          .catch((err) => {
            console.error(
              "[stripe webhook] Uplisting sync error:",
              err
            );
            prisma.bookings
              .update({
                where: { id: bookingId },
                data: { uplisting_sync_status: "failed" },
              })
              .catch(() => {});
          });

        // Send booking confirmation email (non-blocking)
        sendBookingConfirmation({
          guestName: metadata.guestName || "",
          guestEmail: metadata.guestEmail || "",
          accommodation:
            metadata.accommodationName ||
            metadata.accommodation ||
            "",
          checkIn: metadata.checkIn || "",
          checkOut: metadata.checkOut || "",
          guests: Number(metadata.guests) || 1,
          totalAmount: (session.amount_total || 0) / 100,
        }).catch((err) =>
          console.error("[stripe webhook] Email error:", err)
        );

        // Capture the booking amount (not the security deposit)
        if (stripe && session.payment_intent) {
          try {
            const depositAmount =
              Number(metadata.securityDeposit || 300) * 100;
            const captureAmount =
              (session.amount_total || 0) - depositAmount;

            if (captureAmount > 0) {
              await stripe.paymentIntents.capture(
                session.payment_intent as string,
                { amount_to_capture: captureAmount }
              );
              console.log(
                `[stripe webhook] Captured $${captureAmount / 100}, deposit hold: $${depositAmount / 100}`
              );
            }
          } catch (captureErr) {
            console.error(
              "[stripe webhook] Capture error:",
              captureErr
            );
          }
        }

        break;
      }

      case "charge.refunded": {
        const charge = event.data.object;
        const paymentIntentId = charge.payment_intent as string;

        console.log(
          "[stripe webhook] charge.refunded:",
          paymentIntentId,
          "amount refunded:",
          charge.amount_refunded
        );

        // Find the booking by stripe_payment_id and update status
        if (paymentIntentId) {
          try {
            await prisma.bookings.updateMany({
              where: { stripe_payment_id: paymentIntentId },
              data: {
                payment_status: "refunded",
                status: "cancelled",
                updated_at: new Date(),
              },
            });
            console.log(
              `[stripe webhook] Booking marked as refunded for PI: ${paymentIntentId}`
            );
          } catch (dbErr) {
            console.error(
              "[stripe webhook] Refund DB update error:",
              dbErr
            );
          }
        }
        break;
      }

      case "payment_intent.canceled": {
        const pi = event.data.object;
        console.log(
          "[stripe webhook] payment_intent.canceled:",
          pi.id,
          "— deposit hold released by Stripe"
        );

        // Update deposit status if this was an uncaptured deposit hold
        try {
          await prisma.bookings.updateMany({
            where: {
              security_deposit_intent_id: pi.id,
              security_deposit_status: "held",
            },
            data: {
              security_deposit_status: "released",
              security_deposit_released_at: new Date(),
              updated_at: new Date(),
            },
          });
        } catch (dbErr) {
          console.error(
            "[stripe webhook] Deposit release DB error:",
            dbErr
          );
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object;
        console.error(
          "[stripe webhook] Payment failed:",
          paymentIntent.id,
          paymentIntent.last_payment_error?.message
        );
        break;
      }

      default:
        console.log(
          `[stripe webhook] Unhandled event: ${event.type}`
        );
    }

    // Mark event as processed (deduplication)
    await prisma.processed_webhook_events
      .create({ data: { event_id: event.id } })
      .catch(() => {});

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[api/stripe/webhook] Error:", err);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 400 }
    );
  }
}

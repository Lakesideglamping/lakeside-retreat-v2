import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { constructWebhookEvent, stripe, isDevMode } from "@/lib/stripe";
import { sendBookingConfirmation, sendSystemAlert } from "@/lib/email";
import { syncBooking } from "@/lib/uplisting";
import { prisma } from "@/lib/db";
import { randomUUID } from "crypto";

/**
 * Safely extract a PaymentIntent ID, handling both string and expanded-object forms.
 * Stripe can return payment_intent as a string ID or a full object depending on
 * API version and expansion — casting with `as string` corrupts the expanded form.
 */
function extractPaymentIntentId(
  pi: string | Stripe.PaymentIntent | null | undefined
): string | null {
  if (!pi) return null;
  if (typeof pi === "string") return pi;
  if (typeof pi === "object" && "id" in pi && typeof pi.id === "string") {
    return pi.id;
  }
  return null;
}

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

    // Signature verification failure is a permanent client error → 400.
    let event: Stripe.Event;
    try {
      event = constructWebhookEvent(body, signature);
    } catch (sigErr) {
      console.error("[stripe webhook] Signature verification failed:", sigErr);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

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
        const paymentIntentId = extractPaymentIntentId(session.payment_intent);

        console.log(
          "[stripe webhook] checkout.session.completed:",
          metadata.accommodation,
          metadata.checkIn,
          "to",
          metadata.checkOut
        );

        // 1) Save booking as "authorized" first — capture happens next.
        //    This avoids marking the booking "paid" before Stripe actually captures.
        const bookingId = randomUUID();
        let bookingSaved = false;
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
              payment_status: "authorized",
              notes: metadata.specialRequests || null,
              stripe_session_id: session.id,
              stripe_payment_id: paymentIntentId,
              booking_source: "website",
              uplisting_sync_status: "pending",
              security_deposit_status: "held",
              security_deposit_amount: Number(
                metadata.securityDeposit || 300
              ),
              security_deposit_intent_id: paymentIntentId,
              deposit_release_due: new Date(
                new Date(metadata.checkOut).getTime() +
                  2 * 24 * 60 * 60 * 1000
              ).toISOString(),
            },
          });
          bookingSaved = true;
          console.log(
            `[stripe webhook] Booking saved (authorized): ${bookingId}`
          );
        } catch (dbErr) {
          console.error("[stripe webhook] DB save error:", dbErr);
          await prisma.failed_webhook_events
            .create({
              data: {
                event_id: event.id,
                event_type: event.type,
                stripe_session_id: session.id,
                stripe_payment_id: paymentIntentId,
                booking_id: bookingId,
                event_data: JSON.stringify(metadata),
                error_message:
                  dbErr instanceof Error
                    ? dbErr.message
                    : "Unknown DB error",
              },
            })
            .then(() => {
              const errMsg =
                dbErr instanceof Error ? dbErr.message : "Unknown DB error";
              sendSystemAlert(
                "WEBHOOK_DB_FAILURE",
                `Booking DB save failed for Stripe event ${event.id}`,
                `Guest: ${metadata.guestName} (${metadata.guestEmail})\nAccommodation: ${metadata.accommodation}\nDates: ${metadata.checkIn} → ${metadata.checkOut}\nSession: ${session.id}\nError: ${errMsg}`
              ).catch(() => {});
            })
            .catch((e) =>
              console.error("[stripe webhook] Failed to log error:", e)
            );
        }

        // 2) Capture the booking amount (minus the security-bond hold).
        //    Only mark the booking "paid" once Stripe confirms the capture.
        let captureSucceeded = false;
        if (bookingSaved && stripe && paymentIntentId) {
          try {
            const depositAmount =
              Number(metadata.securityDeposit || 300) * 100;
            const captureAmount =
              (session.amount_total || 0) - depositAmount;

            if (captureAmount > 0) {
              await stripe.paymentIntents.capture(paymentIntentId, {
                amount_to_capture: captureAmount,
              });
              console.log(
                `[stripe webhook] Captured $${captureAmount / 100}, deposit hold: $${depositAmount / 100}`
              );
            }
            captureSucceeded = true;

            await prisma.bookings.update({
              where: { id: bookingId },
              data: {
                payment_status: "paid",
                updated_at: new Date(),
              },
            });
          } catch (captureErr) {
            console.error("[stripe webhook] Capture error:", captureErr);
            const errMsg =
              captureErr instanceof Error
                ? captureErr.message
                : "Unknown capture error";
            await prisma.bookings
              .update({
                where: { id: bookingId },
                data: {
                  payment_status: "capture_failed",
                  updated_at: new Date(),
                },
              })
              .catch(() => {});
            sendSystemAlert(
              "STRIPE_CAPTURE_FAILURE",
              `Payment capture failed for booking ${bookingId}`,
              `Guest: ${metadata.guestName} (${metadata.guestEmail})\nAccommodation: ${metadata.accommodation}\nDates: ${metadata.checkIn} → ${metadata.checkOut}\nPaymentIntent: ${paymentIntentId}\nError: ${errMsg}`
            ).catch(() => {});
          }
        }

        // 3) Sync to Uplisting and send confirmation — only if capture succeeded.
        //    If capture failed, don't block calendar or email the guest.
        if (bookingSaved && captureSucceeded) {
          syncBooking({
            accommodation: metadata.accommodation || "",
            checkIn: metadata.checkIn || "",
            checkOut: metadata.checkOut || "",
            guestName: metadata.guestName || "",
            guestEmail: metadata.guestEmail || "",
            guestPhone: metadata.guestPhone,
            guests: Number(metadata.guests) || 1,
            totalPrice: (session.amount_total || 0) / 100,
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
              const errMsg =
                err instanceof Error ? err.message : "Unknown sync error";
              sendSystemAlert(
                "UPLISTING_SYNC_FAILURE",
                `Uplisting sync failed for booking ${bookingId}`,
                `Guest: ${metadata.guestName} (${metadata.guestEmail})\nAccommodation: ${metadata.accommodation}\nDates: ${metadata.checkIn} → ${metadata.checkOut}\nDouble-booking risk — block dates manually until this is resolved.\nError: ${errMsg}`
              ).catch(() => {});
            });

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
        }

        break;
      }

      case "charge.refunded": {
        const charge = event.data.object;
        const paymentIntentId = extractPaymentIntentId(charge.payment_intent);

        console.log(
          "[stripe webhook] charge.refunded:",
          paymentIntentId,
          "amount refunded:",
          charge.amount_refunded
        );

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
    // Non-signature errors (DB, Stripe API, etc.) are treated as transient —
    // return 500 so Stripe retries. Returning 400 tells Stripe to give up.
    console.error("[api/stripe/webhook] Error:", err);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

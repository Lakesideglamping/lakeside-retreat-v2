import { NextResponse } from "next/server";
import type Stripe from "stripe";
import {
  constructWebhookEvent,
  stripe,
  isDevMode,
  calculateLineItems,
} from "@/lib/stripe";
import { getById } from "@/lib/accommodations";
import {
  sendBookingConfirmation,
  sendCancellationConfirmation,
  sendSystemAlert,
} from "@/lib/email";
import { syncBooking } from "@/lib/uplisting";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { randomUUID } from "crypto";

// Mask an email as "j***@example.com" so production logs don't carry full PII.
function maskEmail(email?: string | null): string {
  if (!email) return "";
  const [user, domain] = email.split("@");
  if (!user || !domain) return "***";
  return `${user[0] ?? ""}***@${domain}`;
}

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
  // In production, a missing STRIPE_SECRET_KEY must be a hard failure — not a
  // silent no-op. Returning 200 here would tell Stripe "received OK" and it
  // would stop retrying, silently losing every booking. Return 503 so Stripe
  // keeps retrying until the key is restored.
  if (process.env.NODE_ENV === "production" && isDevMode) {
    logger.error("stripe webhook: STRIPE_SECRET_KEY not set in production");
    return NextResponse.json(
      { error: "Stripe not configured" },
      { status: 503 }
    );
  }

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
      logger.error("stripe webhook signature verification failed", {
        error: sigErr instanceof Error ? sigErr.message : String(sigErr),
      });
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    // Scoped logger stamps every entry with a shared requestId so concurrent
    // webhook events don't interleave indistinguishably in production logs.
    const log = logger.withRequestId();

    // Webhook deduplication — claim the event ID before processing. Writing
    // the record here (not after the switch) closes the race where processing
    // succeeds but the dedup write fails, causing a duplicate on the next
    // Stripe retry. If we crash after this write but before finishing, the
    // event is silently skipped — acceptable given the booking's
    // stripe_session_id unique constraint acts as a backstop for the most
    // important idempotency case (duplicate bookings).
    try {
      await prisma.processed_webhook_events.create({
        data: { event_id: event.id },
      });
    } catch {
      // Unique constraint violation — already processed on a prior attempt.
      log.info("stripe webhook duplicate event skipped", {
        eventId: event.id,
      });
      return NextResponse.json({ received: true, duplicate: true });
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const metadata = session.metadata || {};
        const paymentIntentId = extractPaymentIntentId(session.payment_intent);

        log.info("checkout.session.completed", {
          accommodation: metadata.accommodation,
          checkIn: metadata.checkIn,
          checkOut: metadata.checkOut,
          sessionId: session.id,
        });

        // Currency guard: if Stripe ever returns a non-NZD currency we'd be
        // persisting an amount in the wrong denomination.
        if ((session.currency || "").toLowerCase() !== "nzd") {
          log.error("stripe webhook currency mismatch", {
            expected: "nzd",
            received: session.currency,
            sessionId: session.id,
          });
          sendSystemAlert(
            "STRIPE_CURRENCY_MISMATCH",
            `Unexpected currency on checkout session ${session.id}`,
            `Expected: nzd\nReceived: ${session.currency}\nAmount: ${session.amount_total}`
          ).catch(() => {});
          return NextResponse.json(
            { error: "Unexpected currency" },
            { status: 400 }
          );
        }

        // Re-verify the charged amount against a server-side calculation.
        // This catches cases where the session metadata was tampered with or
        // the price logic drifts between session creation and capture.
        // seasonalMultiplier and discountAmountCents are stored in metadata at
        // session-creation time so verification always uses the same values.
        const acc = getById(metadata.accommodation || "");
        if (acc && metadata.checkIn && metadata.checkOut) {
          const seasonalMultiplier =
            parseFloat(metadata.seasonalMultiplier || "1") || 1;
          const discountCents =
            parseInt(metadata.discountAmountCents || "0") || 0;
          const { totalAmount: baseTotal } = calculateLineItems(
            acc,
            metadata.checkIn,
            metadata.checkOut,
            Number(metadata.guests) || 1,
            Number(metadata.pets) || 0,
            seasonalMultiplier
          );
          const expectedTotal = baseTotal - discountCents;
          if (session.amount_total !== expectedTotal) {
            log.error("stripe webhook amount mismatch", {
              sessionTotal: session.amount_total,
              expected: expectedTotal,
              sessionId: session.id,
              accommodation: metadata.accommodation,
            });
            sendSystemAlert(
              "STRIPE_AMOUNT_MISMATCH",
              `Session total does not match server calculation for ${session.id}`,
              `Session total: ${session.amount_total}\nExpected: ${expectedTotal}\nAccommodation: ${metadata.accommodation}\nGuest: ${metadata.guestName}`
            ).catch(() => {});
            return NextResponse.json(
              { error: "Amount verification failed" },
              { status: 400 }
            );
          }
        }

        // 1) Save booking — accommodation has already been auto-captured by Stripe
        //    (no more capture_method: manual on the checkout session). The security
        //    deposit will be a separate off-session PI created in step 2.
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
              payment_status: "paid",
              notes: metadata.specialRequests || null,
              stripe_session_id: session.id,
              stripe_payment_id: paymentIntentId,
              booking_source: "website",
              uplisting_sync_status: "pending",
              security_deposit_status: "pending",
              security_deposit_amount: Number(
                metadata.securityDeposit || 300
              ),
              security_deposit_intent_id: null,
              deposit_release_due: new Date(
                new Date(metadata.checkOut).getTime() +
                  2 * 24 * 60 * 60 * 1000
              ).toISOString(),
            },
          });
          bookingSaved = true;
          log.info("booking saved (authorized)", {
            bookingId,
            guestEmailMasked: maskEmail(metadata.guestEmail),
          });
        } catch (dbErr) {
          log.error("stripe webhook DB save error", {
            bookingId,
            error: dbErr instanceof Error ? dbErr.message : String(dbErr),
          });
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
                `Guest: ${metadata.guestName} (${maskEmail(metadata.guestEmail)})\nBooking ID: ${bookingId}\nAccommodation: ${metadata.accommodation}\nDates: ${metadata.checkIn} → ${metadata.checkOut}\nSession: ${session.id}\nError: ${errMsg}`
              ).catch(() => {});
            })
            .catch((e) =>
              log.error("stripe webhook failed to log error", {
                error: e instanceof Error ? e.message : String(e),
              })
            );
        }

        // Increment promo code usage counter now that payment has confirmed.
        // Uses a raw atomic update so a race between two concurrent webhooks
        // can't push usage_count past usage_limit. Fire-and-forget: a failure
        // here never blocks the booking, but we log 0-row results so staff can
        // see when a promo was honoured at checkout but the limit was already
        // reached (race lost) or the code was deleted between session creation
        // and payment.
        if (bookingSaved && metadata.promoCode) {
          const promoCode = metadata.promoCode;
          prisma
            .$executeRaw`
              UPDATE promo_codes
              SET usage_count = COALESCE(usage_count, 0) + 1,
                  updated_at = NOW()
              WHERE code = ${promoCode}
                AND (usage_limit IS NULL OR COALESCE(usage_count, 0) < usage_limit)
            `
            .then((rows) => {
              if (rows === 0) {
                log.warn("stripe webhook promo increment missed", {
                  promoCode,
                  note: "row not updated — usage_limit reached or code removed after checkout session was created",
                });
              }
            })
            .catch((e) =>
              log.error("stripe webhook promo increment failed", {
                promoCode,
                error: e instanceof Error ? e.message : String(e),
              })
            );
        }

        // 2) Create a separate off-session PaymentIntent for the security deposit
        //    (capture_method: manual, auto-confirmed against the saved payment method).
        //    This replaces the previous partial-capture trick, which locked the deposit
        //    amount into the same PI as the accommodation and made later capture/release
        //    mathematically impossible.
        if (bookingSaved && stripe && paymentIntentId) {
          try {
            // Fetch the main PI to get the saved payment_method.
            const mainPi =
              await stripe.paymentIntents.retrieve(paymentIntentId);
            const paymentMethodId =
              typeof mainPi.payment_method === "string"
                ? mainPi.payment_method
                : mainPi.payment_method?.id;
            const customerId =
              typeof session.customer === "string"
                ? session.customer
                : session.customer?.id;

            if (!paymentMethodId || !customerId) {
              throw new Error(
                "Missing customer or payment_method on checkout session"
              );
            }

            const depositAmount =
              Number(metadata.securityDeposit || 300) * 100;

            const depositPi = await stripe.paymentIntents.create(
              {
                amount: depositAmount,
                currency: "nzd",
                customer: customerId,
                payment_method: paymentMethodId,
                capture_method: "manual",
                confirm: true,
                off_session: true,
                description: `Security deposit hold — booking ${bookingId}`,
                metadata: {
                  bookingId,
                  type: "security_deposit",
                },
              },
              { idempotencyKey: `deposit_${bookingId}` }
            );

            await prisma.bookings.update({
              where: { id: bookingId },
              data: {
                security_deposit_intent_id: depositPi.id,
                security_deposit_status: "held",
                updated_at: new Date(),
              },
            });

            log.info("deposit hold created", {
              bookingId,
              depositPiId: depositPi.id,
              amount: depositAmount / 100,
            });
          } catch (depErr) {
            log.error("deposit hold creation failed", {
              bookingId,
              error:
                depErr instanceof Error ? depErr.message : String(depErr),
            });
            const errMsg =
              depErr instanceof Error
                ? depErr.message
                : "Unknown deposit-hold error";
            await prisma.bookings
              .update({
                where: { id: bookingId },
                data: {
                  security_deposit_status: "failed_to_hold",
                  updated_at: new Date(),
                },
              })
              .catch(() => {});
            sendSystemAlert(
              "DEPOSIT_HOLD_FAILURE",
              `Security deposit hold failed for booking ${bookingId}`,
              `Guest: ${metadata.guestName} (${maskEmail(metadata.guestEmail)})\nBooking ID: ${bookingId}\nAccommodation: ${metadata.accommodation}\nDates: ${metadata.checkIn} → ${metadata.checkOut}\nAccommodation already paid; deposit NOT held — look up booking for full contact details.\nError: ${errMsg}`
            ).catch(() => {});
          }
        }

        // 3) Sync to Uplisting and send confirmation — run regardless of deposit
        //    outcome. Accommodation is paid; deposit failure is a separate concern
        //    handled by the admin alert above.
        if (bookingSaved) {
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
              log.error("uplisting sync failed", {
                bookingId,
                error: err instanceof Error ? err.message : String(err),
              });
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
                `Guest: ${metadata.guestName} (${maskEmail(metadata.guestEmail)})\nBooking ID: ${bookingId}\nAccommodation: ${metadata.accommodation}\nDates: ${metadata.checkIn} → ${metadata.checkOut}\nDouble-booking risk — block dates manually until this is resolved.\nError: ${errMsg}`
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
            bookingId,
          }).catch((err) =>
            log.error("booking confirmation email failed", {
              bookingId,
              error: err instanceof Error ? err.message : String(err),
            })
          );
        }

        break;
      }

      case "charge.refunded": {
        const charge = event.data.object;
        const paymentIntentId = extractPaymentIntentId(charge.payment_intent);

        log.info("charge.refunded", {
          paymentIntentId,
          amountRefunded: charge.amount_refunded,
          amountTotal: charge.amount,
        });

        // Only cancel the booking on a full refund. Partial refunds (e.g. a
        // goodwill adjustment) must not cancel an active stay.
        const isFullRefund = charge.amount_refunded >= charge.amount;

        if (paymentIntentId && isFullRefund) {
          try {
            // Find the booking first so we only email if we're actually moving
            // it from a non-cancelled state — prevents duplicate emails when
            // Stripe replays the event.
            const existing = await prisma.bookings.findFirst({
              where: { stripe_payment_id: paymentIntentId, deleted_at: null },
            });

            await prisma.bookings.updateMany({
              where: { stripe_payment_id: paymentIntentId },
              data: {
                payment_status: "refunded",
                status: "cancelled",
                updated_at: new Date(),
              },
            });
            log.info("booking marked refunded (full refund)", { paymentIntentId });

            if (existing && existing.status !== "cancelled" && existing.guest_email) {
              sendCancellationConfirmation({
                guest_name: existing.guest_name ?? "Guest",
                guest_email: existing.guest_email,
                accommodation: existing.accommodation ?? "",
                check_in: existing.check_in.toISOString(),
                check_out: existing.check_out.toISOString(),
                total_price: existing.total_price ? String(existing.total_price) : undefined,
                booking_id: existing.id,
                refundEligible: true,
              }).catch((err) =>
                log.error("cancellation email failed", {
                  bookingId: existing.id,
                  error: err instanceof Error ? err.message : String(err),
                })
              );
            }
          } catch (dbErr) {
            log.error("refund DB update failed", {
              paymentIntentId,
              error: dbErr instanceof Error ? dbErr.message : String(dbErr),
            });
          }
        } else if (paymentIntentId && !isFullRefund) {
          log.info("partial refund — booking status unchanged", {
            paymentIntentId,
            amountRefunded: charge.amount_refunded,
            amountTotal: charge.amount,
          });
        }
        break;
      }

      case "payment_intent.canceled": {
        const pi = event.data.object;
        log.info("payment_intent.canceled — deposit hold released", {
          paymentIntentId: pi.id,
        });

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
          log.error("deposit release DB update failed", {
            paymentIntentId: pi.id,
            error: dbErr instanceof Error ? dbErr.message : String(dbErr),
          });
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object;
        log.warn("payment_intent.payment_failed", {
          paymentIntentId: paymentIntent.id,
          error: paymentIntent.last_payment_error?.message,
        });
        break;
      }

      default:
        log.debug("unhandled stripe event", { type: event.type });
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    // Non-signature errors (DB, Stripe API, etc.) are treated as transient —
    // return 500 so Stripe retries. Returning 400 tells Stripe to give up.
    logger.error("stripe webhook handler failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

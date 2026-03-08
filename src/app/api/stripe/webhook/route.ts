import { NextResponse } from "next/server";
import { constructWebhookEvent, stripe, isDevMode } from "@/lib/stripe";
import { sendBookingConfirmation } from "@/lib/email";
import { syncBooking } from "@/lib/uplisting";

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

        // Sync booking to Uplisting (non-blocking)
        syncBooking({
          accommodation: metadata.accommodation || "",
          checkIn: metadata.checkIn || "",
          checkOut: metadata.checkOut || "",
          guestName: metadata.guestName || "",
          guestEmail: metadata.guestEmail || "",
          guestPhone: metadata.guestPhone,
          guests: Number(metadata.guests) || 1,
        }).catch((err) =>
          console.error("[stripe webhook] Uplisting sync error:", err)
        );

        // Send booking confirmation email (non-blocking)
        sendBookingConfirmation({
          guestName: metadata.guestName || "",
          guestEmail: metadata.guestEmail || "",
          accommodation: metadata.accommodationName || metadata.accommodation || "",
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
        console.log(`[stripe webhook] Unhandled event: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[api/stripe/webhook] Error:", err);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 400 }
    );
  }
}

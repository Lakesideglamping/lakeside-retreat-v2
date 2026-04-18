import Stripe from "stripe";
import { getById, type Accommodation } from "./accommodations";

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-02-25.clover",
    })
  : null;

export const isDevMode = !process.env.STRIPE_SECRET_KEY;

const baseUrl = () =>
  process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

function daysBetween(checkIn: string, checkOut: string): number {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

export interface LineItem {
  name: string;
  amount: number; // in cents
  quantity: number;
}

export function calculateLineItems(
  accommodation: Accommodation,
  checkIn: string,
  checkOut: string,
  guests: number,
  pets: number = 0
): { lineItems: LineItem[]; totalAmount: number } {
  const nights = daysBetween(checkIn, checkOut);
  const items: LineItem[] = [];

  // Nightly rate
  items.push({
    name: `${accommodation.name} (${nights} night${nights > 1 ? "s" : ""})`,
    amount: accommodation.basePrice * 100,
    quantity: nights,
  });

  // Cleaning fee
  items.push({
    name: "Cleaning fee",
    amount: accommodation.cleaningFee * 100,
    quantity: 1,
  });

  // Extra guest fee
  if (
    accommodation.extraGuestFee &&
    guests > accommodation.baseGuests
  ) {
    const extraGuests = guests - accommodation.baseGuests;
    items.push({
      name: `Extra guest fee (${extraGuests} guest${extraGuests > 1 ? "s" : ""})`,
      amount: accommodation.extraGuestFee * 100,
      quantity: nights * extraGuests,
    });
  }

  // Pet fee
  if (accommodation.petFee && pets > 0) {
    items.push({
      name: `Pet fee (${pets} pet${pets > 1 ? "s" : ""})`,
      amount: accommodation.petFee * 100,
      quantity: pets,
    });
  }

  // Security deposit is NOT a line item — it's a separate off-session
  // PaymentIntent (manual capture) created by the webhook after checkout
  // completes. Keeping it out of the Checkout total avoids the partial-capture
  // trap (once a PI is partial-captured, the remainder can't be captured later).

  const totalAmount = items.reduce((sum, i) => sum + i.amount * i.quantity, 0);

  return { lineItems: items, totalAmount };
}

interface CreateSessionParams {
  accommodation: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  specialRequests?: string;
  pets?: number;
}

export async function createCheckoutSession(
  params: CreateSessionParams
): Promise<{ sessionId: string; url: string }> {
  const acc = getById(params.accommodation);
  if (!acc) throw new Error("Invalid accommodation");

  if (!stripe) {
    // Dev mode mock
    return {
      sessionId: "dev_mock_session_" + Date.now(),
      url: `${baseUrl()}/booking-success?session_id=dev_mock`,
    };
  }

  const { lineItems } = calculateLineItems(
    acc,
    params.checkIn,
    params.checkOut,
    params.guests,
    params.pets || 0
  );

  const checkInFormatted = new Date(params.checkIn).toLocaleDateString("en-NZ", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const checkOutFormatted = new Date(params.checkOut).toLocaleDateString("en-NZ", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: params.guestEmail,
    customer_creation: "always",
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    payment_intent_data: {
      // Save the payment method to the customer so the webhook can create an
      // off-session deposit hold PaymentIntent against the same card.
      setup_future_usage: "off_session",
    },
    custom_text: {
      submit: {
        message: `A $${acc.securityDeposit} NZD security bond will be pre-authorised on your card separately after booking and released within 48 hours of checkout.`,
      },
    },
    line_items: lineItems.map((item, i) => ({
      price_data: {
        currency: "nzd",
        product_data: {
          name: item.name,
          // Add check-in/out dates as description on the first (accommodation) line item
          ...(i === 0
            ? { description: `Check-in: ${checkInFormatted} · Check-out: ${checkOutFormatted} · ${params.guests} guest${params.guests > 1 ? "s" : ""}` }
            : {}),
        },
        unit_amount: item.amount,
      },
      quantity: item.quantity,
    })),
    metadata: {
      accommodation: params.accommodation,
      accommodationName: acc.name,
      checkIn: params.checkIn,
      checkOut: params.checkOut,
      guests: String(params.guests),
      guestName: params.guestName,
      guestEmail: params.guestEmail,
      guestPhone: params.guestPhone || "",
      specialRequests: params.specialRequests || "",
      pets: String(params.pets || 0),
      securityDeposit: String(acc.securityDeposit),
    },
    success_url: `${baseUrl()}/booking-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl()}/booking-cancelled`,
  });

  return {
    sessionId: session.id,
    url: session.url!,
  };
}

export function constructWebhookEvent(
  body: string,
  signature: string
): Stripe.Event {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error("Stripe not configured");
  }
  return stripe.webhooks.constructEvent(
    body,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  );
}

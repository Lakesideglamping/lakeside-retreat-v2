import Stripe from "stripe";
import { getById } from "./accommodations";
import type { StayQuote } from "./pricing";
import { formatCalendarDate } from "./format-date";

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-02-25.clover",
    })
  : null;

export const isDevMode = !process.env.STRIPE_SECRET_KEY;

const baseUrl = () =>
  process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

export interface LineItem {
  name: string;
  amount: number; // in cents
  quantity: number;
}

/**
 * Stripe line items for a quote. The quote already carries every charged
 * item in cents (nightly stay from Uplisting's live rates, extra guest fee,
 * pet fee); this is a straight mapping. Discounts are not line items —
 * Stripe Checkout rejects negative amounts — so they travel as a coupon on
 * the session instead (see createCheckoutSession).
 */
export function quoteToLineItems(quote: StayQuote): LineItem[] {
  return quote.lineItems.map((item) => ({
    name: item.label,
    amount: item.amountCents,
    quantity: item.quantity,
  }));
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
  /** The server-side quote the guest saw: its line items are what Stripe charges. */
  quote: StayQuote;
  /** Where the quote's rates came from — recorded on the session for the audit trail. */
  rateSource: "live" | "cached";
  /** Promo code string (for metadata and coupon label). */
  promoCode?: string;
  /**
   * Total discount to apply in cents (positive integer): the dome
   * second-night discount plus any promo. Shown as one Stripe coupon
   * deduction — Checkout allows a single discount per session.
   */
  discountAmountCents?: number;
  /** Human label for the coupon, e.g. "25% off your second night + Promo code: X". */
  discountLabel?: string;
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

  const lineItems = quoteToLineItems(params.quote);
  const quotedTotalCents =
    params.quote.subtotalCents - (params.discountAmountCents ?? 0);

  // Calendar dates for the Stripe line item the guest sees at checkout and on
  // the receipt. Pinned so they match the booking form whatever zone the
  // server runs in.
  const stayDateFormat: Intl.DateTimeFormatOptions = {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  };
  const checkInFormatted = formatCalendarDate(params.checkIn, stayDateFormat);
  const checkOutFormatted = formatCalendarDate(params.checkOut, stayDateFormat);

  // Create an ephemeral Stripe coupon when a promo discount is being applied.
  // The coupon shows as a named deduction in Stripe Checkout, separate from the
  // line items, so the guest can see exactly what they saved.
  let stripeCouponId: string | undefined;
  if (params.discountAmountCents && params.discountAmountCents > 0) {
    const coupon = await stripe.coupons.create(
      {
        amount_off: params.discountAmountCents,
        currency: "nzd",
        duration: "once",
        name: params.discountLabel
          ? params.discountLabel.slice(0, 40) // Stripe caps coupon names at 40 chars
          : params.promoCode
            ? `Promo code: ${params.promoCode}`
            : "Promotional discount",
      },
      {
        // The amount belongs in the key.
        //
        // This was keyed on accommodation + check-in + code alone, but the
        // amount also depends on check-out, guests, pets, the live nightly
        // rates and the code's own discount_value — none of which were in
        // the key. Two visitors eyeing the same dome from the same date for
        // different lengths of stay therefore produced one key and two
        // amounts, and Stripe rejects a reused key whose parameters differ.
        // The second visitor got "Failed to create payment session" and could
        // not book for up to 24 hours, with nothing in our logs naming the
        // cause. Abandoned checkouts make that collision ordinary rather than
        // rare, and it bites hardest on the dates people actually want.
        //
        // amount_off is the only parameter here that varies, so including it
        // makes the key vary exactly when the request does — while a genuine
        // retry (a double-click, a refresh) still resolves to the same key and
        // reuses the existing coupon, which is what the key is for.
        idempotencyKey: `coupon_${params.accommodation}_${params.checkIn}_${params.promoCode ?? "discount"}_${params.discountAmountCents}`,
      }
    );
    stripeCouponId = coupon.id;
  }

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
    ...(stripeCouponId ? { discounts: [{ coupon: stripeCouponId }] } : {}),
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
      // The total we quoted, so the webhook can verify Stripe charged exactly
      // what the guest was shown without re-fetching rates that may since
      // have changed in Uplisting.
      quotedTotalCents: String(quotedTotalCents),
      rateSource: params.rateSource,
      promoCode: params.promoCode || "",
      discountAmountCents: String(params.discountAmountCents || 0),
      discountLabel: params.discountLabel || "",
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

/**
 * Retrieve a Checkout Session by ID.
 *
 * Centralises all STRIPE_SECRET_KEY usage in this module so no other file
 * needs to instantiate Stripe directly. Returns null when Stripe is not
 * configured (dev mode) or the session_id is invalid.
 */
export async function retrieveCheckoutSession(
  sessionId: string
): Promise<Stripe.Checkout.Session | null> {
  if (!stripe) return null;
  try {
    return await stripe.checkout.sessions.retrieve(sessionId);
  } catch {
    return null;
  }
}

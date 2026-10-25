import { NextResponse } from "next/server";
import { paymentSessionSchema } from "@/lib/validations";
import { getById } from "@/lib/accommodations";
import { createCheckoutSession } from "@/lib/stripe";
import { getStayQuote } from "@/lib/quote";
import { checkAvailability } from "@/lib/uplisting";
import { checkRateLimit } from "@/lib/rate-limit";
import { isPastInNZ } from "@/lib/date-range";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  try {
    const ip =
      request.headers.get("x-real-ip")?.trim() ||
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";

    const { success } = await checkRateLimit(
      `payment:${ip}`,
      15 * 60 * 1000,
      10
    );
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const result = paymentSessionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = result.data;
    const accommodation = getById(data.accommodation);
    if (!accommodation) {
      return NextResponse.json(
        { error: "Invalid accommodation" },
        { status: 400 }
      );
    }

    // Validate guest count
    if (data.guests > accommodation.maxGuests) {
      return NextResponse.json(
        { error: `Maximum ${accommodation.maxGuests} guests for ${accommodation.name}` },
        { status: 400 }
      );
    }

    // Validate pets. A property allows pets only if it has a petFee — that
    // is the Lakeside Cottage ($25 flat per stay) and no other. Do NOT gate
    // this on adultsOnly: every property is adults-only (no children), which
    // is independent of whether dogs are welcome. Gating on adultsOnly
    // rejected pets everywhere, including the pet-friendly cottage.
    if (data.pets && data.pets > 0 && !accommodation.petFee) {
      return NextResponse.json(
        { error: "Pets are not allowed in this accommodation" },
        { status: 400 }
      );
    }

    // Validate dates
    const checkIn = new Date(data.checkIn);
    const checkOut = new Date(data.checkOut);

    // "Today" means today in New Zealand, where the property is — not on the
    // server. Render runs UTC, 12–13 hours behind, so comparing against the
    // server's midnight accepted already-past dates every NZ morning from
    // midnight until midday: at 08:00 on 9 September in Cromwell the server
    // still believed it was the 8th and let the 8th through.
    if (isPastInNZ(data.checkIn)) {
      return NextResponse.json(
        { error: "Check-in date must be today or later" },
        { status: 400 }
      );
    }

    const nights = Math.round(
      (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (nights < accommodation.minStay) {
      return NextResponse.json(
        { error: `Minimum stay is ${accommodation.minStay} night${accommodation.minStay > 1 ? "s" : ""}` },
        { status: 400 }
      );
    }

    // Check availability via Uplisting
    const available = await checkAvailability(
      data.accommodation,
      data.checkIn,
      data.checkOut
    );
    if (!available) {
      return NextResponse.json(
        { error: "These dates are no longer available. Please select different dates." },
        { status: 409 }
      );
    }

    // Price the stay server-side from live Uplisting rates — the same quote
    // the booking page showed. If Uplisting is down and nothing is cached,
    // there is no honest price to charge, so checkout stops here.
    const quoted = await getStayQuote({
      accommodation: data.accommodation,
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      guests: data.guests,
      pets: data.pets || 0,
    });
    if (!quoted) {
      return NextResponse.json(
        { error: "Prices are temporarily unavailable. Please try again in a few minutes." },
        { status: 503 }
      );
    }
    const { quote } = quoted;

    // Discounts: the dome second-night offer (already in the quote) plus any
    // promo code. Stripe Checkout takes one coupon per session, so they are
    // summed into a single deduction with a combined label.
    let discountAmountCents = quote.discount?.amountCents ?? 0;
    const discountLabels: string[] = quote.discount ? [quote.discount.label] : [];
    let appliedPromoCode: string | undefined;

    if (data.promoCode) {
      const code = data.promoCode.trim().toUpperCase();
      const now = new Date();

      const promo = await prisma.promo_codes.findFirst({
        where: {
          code: { equals: code, mode: "insensitive" },
          status: "active",
          AND: [
            { OR: [{ valid_from: null }, { valid_from: { lte: now } }] },
            { OR: [{ valid_until: null }, { valid_until: { gte: now } }] },
          ],
        },
      });

      if (!promo) {
        return NextResponse.json(
          { error: "Invalid or expired promo code" },
          { status: 400 }
        );
      }
      if (promo.usage_limit && (promo.usage_count ?? 0) >= promo.usage_limit) {
        return NextResponse.json(
          { error: "This promo code has reached its usage limit" },
          { status: 400 }
        );
      }
      if (promo.min_stay && nights < promo.min_stay) {
        return NextResponse.json(
          {
            error: `This promo code requires a minimum stay of ${promo.min_stay} night${promo.min_stay > 1 ? "s" : ""}`,
          },
          { status: 400 }
        );
      }

      // A percentage promo applies to what the guest would otherwise pay —
      // after the second-night discount, not stacked on the undiscounted total.
      const promoBaseCents = quote.totalCents;
      let promoCents: number;
      if (promo.discount_type === "percentage") {
        promoCents = Math.round(promoBaseCents * (Number(promo.discount_value) / 100));
      } else {
        // Fixed NZD discount — cap at what is left to pay
        promoCents = Math.min(Math.round(Number(promo.discount_value) * 100), promoBaseCents);
      }

      discountAmountCents += promoCents;
      discountLabels.push(`Promo code: ${promo.code}`);
      appliedPromoCode = promo.code;
    }

    // Create Stripe session
    const session = await createCheckoutSession({
      accommodation: data.accommodation,
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      guests: data.guests,
      guestName: data.guestName,
      guestEmail: data.guestEmail,
      guestPhone: data.guestPhone,
      specialRequests: data.specialRequests,
      pets: data.pets,
      quote,
      rateSource: quoted.source,
      promoCode: appliedPromoCode,
      discountAmountCents,
      discountLabel: discountLabels.join(" + ") || undefined,
    });

    return NextResponse.json({
      success: true,
      sessionId: session.sessionId,
      url: session.url,
      totalAmount: (quote.subtotalCents - discountAmountCents) / 100,
    });
  } catch (err) {
    logger.error("[api/payments/create-session] Error", { err });
    return NextResponse.json(
      { error: "Failed to create payment session" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { paymentSessionSchema } from "@/lib/validations";
import { getById } from "@/lib/accommodations";
import { createCheckoutSession, calculateLineItems } from "@/lib/stripe";
import { checkAvailability } from "@/lib/uplisting";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";

    const { success } = checkRateLimit(
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

    // Validate adults only
    if (accommodation.adultsOnly && data.pets && data.pets > 0) {
      return NextResponse.json(
        { error: "Pets are not allowed in this accommodation" },
        { status: 400 }
      );
    }

    // Validate dates
    const checkIn = new Date(data.checkIn);
    const checkOut = new Date(data.checkOut);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkIn < today) {
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

    // Calculate expected pricing for verification
    const { totalAmount } = calculateLineItems(
      accommodation,
      data.checkIn,
      data.checkOut,
      data.guests,
      data.pets || 0
    );

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
    });

    return NextResponse.json({
      success: true,
      sessionId: session.sessionId,
      url: session.url,
      totalAmount: totalAmount / 100,
    });
  } catch (err) {
    console.error("[api/payments/create-session] Error:", err);
    return NextResponse.json(
      { error: "Failed to create payment session" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getById } from "@/lib/accommodations";
import { getStayQuote } from "@/lib/quote";
import { isPastInNZ } from "@/lib/date-range";
import { logger } from "@/lib/logger";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * GET /api/pricing?accommodation=&checkIn=&checkOut=&guests=&pets=
 *
 * The live quote for a stay: Uplisting's nightly rates (GST inclusive, NZD),
 * local add-ons, and the dome second-night discount. The booking page shows
 * exactly this; checkout recomputes it server-side, so the two cannot drift.
 *
 * 503 with `error: "PRICES_UNAVAILABLE"` means Uplisting is unreachable and
 * there is no cached copy either. The client shows a retry state — never a
 * fallback number.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const accommodationId = searchParams.get("accommodation") || "";
  const checkIn = searchParams.get("checkIn") || "";
  const checkOut = searchParams.get("checkOut") || "";
  const guests = Number(searchParams.get("guests") || "2");
  const pets = Number(searchParams.get("pets") || "0");

  const accommodation = getById(accommodationId);
  if (!accommodation) {
    return NextResponse.json({ error: "Invalid accommodation" }, { status: 400 });
  }
  if (!DATE_RE.test(checkIn) || !DATE_RE.test(checkOut) || checkOut <= checkIn) {
    return NextResponse.json({ error: "Invalid dates" }, { status: 400 });
  }
  // "Today" is today in New Zealand, where the property is — not on the server.
  if (isPastInNZ(checkIn)) {
    return NextResponse.json({ error: "Check-in date must be today or later" }, { status: 400 });
  }
  if (!Number.isInteger(guests) || guests < 1 || guests > accommodation.maxGuests) {
    return NextResponse.json({ error: "Invalid guest count" }, { status: 400 });
  }
  if (!Number.isInteger(pets) || pets < 0 || pets > 2 || (pets > 0 && !accommodation.petFee)) {
    return NextResponse.json({ error: "Invalid pet count" }, { status: 400 });
  }

  try {
    const result = await getStayQuote({
      accommodation: accommodationId,
      checkIn,
      checkOut,
      guests,
      pets,
    });
    if (!result) {
      return NextResponse.json(
        { success: false, error: "PRICES_UNAVAILABLE" },
        { status: 503 }
      );
    }
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    logger.error("[api/pricing] Error", { err });
    return NextResponse.json(
      { success: false, error: "PRICES_UNAVAILABLE" },
      { status: 503 }
    );
  }
}

import { NextResponse } from "next/server";
import { availabilityCheckSchema } from "@/lib/validations";
import { checkAvailability } from "@/lib/uplisting";
import { isPastInNZ } from "@/lib/date-range";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = availabilityCheckSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { accommodation, checkIn, checkOut } = result.data;

    // "Today" means today in New Zealand, where the property is — not on the
    // server. Render runs UTC, 12–13 hours behind, so comparing against the
    // server's midnight accepted already-past dates every NZ morning from
    // midnight until midday: at 08:00 on 9 September in Cromwell the server
    // still believed it was the 8th and let the 8th through. Same fix as
    // create-session, which this endpoint front-runs.
    if (isPastInNZ(checkIn)) {
      return NextResponse.json(
        { error: "Check-in date must be today or later" },
        { status: 400 }
      );
    }
    // Both are validated YYYY-MM-DD, which sorts lexicographically in
    // calendar order — so comparing the strings avoids re-introducing a
    // timezone at the point of comparison.
    if (checkOut <= checkIn) {
      return NextResponse.json(
        { error: "Check-out must be after check-in" },
        { status: 400 }
      );
    }

    const available = await checkAvailability(accommodation, checkIn, checkOut);

    return NextResponse.json({ success: true, available });
  } catch (err) {
    logger.error("[api/availability] Error", { err });
    return NextResponse.json(
      { error: "Failed to check availability" },
      { status: 500 }
    );
  }
}

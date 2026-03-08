import { NextResponse } from "next/server";
import { availabilityCheckSchema } from "@/lib/validations";
import { checkAvailability } from "@/lib/uplisting";

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

    // Basic date validation
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start < today) {
      return NextResponse.json(
        { error: "Check-in date must be today or later" },
        { status: 400 }
      );
    }
    if (end <= start) {
      return NextResponse.json(
        { error: "Check-out must be after check-in" },
        { status: 400 }
      );
    }

    const available = await checkAvailability(accommodation, checkIn, checkOut);

    return NextResponse.json({ success: true, available });
  } catch (err) {
    console.error("[api/availability] Error:", err);
    return NextResponse.json(
      { error: "Failed to check availability" },
      { status: 500 }
    );
  }
}

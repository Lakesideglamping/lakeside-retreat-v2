import { NextResponse } from "next/server";
import { getValidIds } from "@/lib/accommodations";
import { fetchBlockedDates } from "@/lib/uplisting";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const accommodation = searchParams.get("accommodation");

  if (!accommodation || !getValidIds().includes(accommodation)) {
    return NextResponse.json(
      { error: "Invalid or missing accommodation parameter" },
      { status: 400 }
    );
  }

  try {
    const blockedDates = await fetchBlockedDates(accommodation);
    return NextResponse.json({ success: true, blockedDates });
  } catch (err) {
    console.error("[api/blocked-dates] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch blocked dates" },
      { status: 500 }
    );
  }
}

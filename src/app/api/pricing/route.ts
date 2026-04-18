import { NextResponse } from "next/server";
import { getSeasonalMultiplier } from "@/lib/stripe";
import { getValidIds } from "@/lib/accommodations";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const accommodation = searchParams.get("accommodation") || "";
  const checkIn = searchParams.get("checkIn") || "";
  const checkOut = searchParams.get("checkOut") || "";

  if (!getValidIds().includes(accommodation) || !checkIn || !checkOut) {
    return NextResponse.json({ seasonalMultiplier: 1 });
  }

  const seasonalMultiplier = await getSeasonalMultiplier(checkIn, checkOut);
  return NextResponse.json({ seasonalMultiplier });
}

import { NextResponse } from "next/server";
import { getValidIds } from "@/lib/accommodations";
import { getFromRates } from "@/lib/quote";
import { nzToday } from "@/lib/date-range";
import { logger } from "@/lib/logger";

/**
 * GET /api/pricing/from
 *
 * Lowest live nightly rate per property over the next 90 NZ calendar days,
 * for the "from $X/night" line on the booking page's property cards. A null
 * means no rates are known for that property; the card then shows no number.
 */
export async function GET() {
  try {
    const from = await getFromRates(getValidIds(), nzToday());
    return NextResponse.json({ success: true, from });
  } catch (err) {
    logger.error("[api/pricing/from] Error", { err });
    return NextResponse.json({ success: false, from: {} }, { status: 503 });
  }
}

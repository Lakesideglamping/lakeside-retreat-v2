import { NextResponse } from "next/server";
import { verifyCronSecret } from "@/lib/cron-auth";
import { logger } from "@/lib/logger";
import {
  findAbandonedCheckouts,
  processAbandonedCheckout,
} from "@/lib/marketing-automation";

export async function POST(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const abandoned = await findAbandonedCheckouts();
    let processed = 0;

    for (const checkout of abandoned) {
      await processAbandonedCheckout(checkout);
      processed++;
    }

    logger.info("Abandoned checkout processing completed", {
      job: "abandoned-checkout",
      processed,
    });

    return NextResponse.json({ success: true, processed });
  } catch (error) {
    logger.error("Abandoned checkout processing failed", {
      job: "abandoned-checkout",
      error: String(error),
    });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

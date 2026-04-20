import { NextResponse } from "next/server";
import { verifyCronSecret } from "@/lib/cron-auth";
import { logger } from "@/lib/logger";
import { sendSystemAlert } from "@/lib/email";
import {
  findReviewCandidates,
  processReviewRequest,
} from "@/lib/marketing-automation";

export async function POST(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const candidates = await findReviewCandidates();
    let sent = 0;

    for (const booking of candidates) {
      await processReviewRequest(booking);
      sent++;
    }

    logger.info("Review request processing completed", {
      job: "review-request",
      sent,
    });

    return NextResponse.json({ success: true, sent });
  } catch (error) {
    logger.error("Review request processing failed", {
      job: "review-request",
      error: String(error),
    });
    sendSystemAlert("CRON_FAILURE", "Cron job failed: review-request", String(error)).catch(() => {});
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

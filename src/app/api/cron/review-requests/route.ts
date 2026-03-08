import { NextResponse } from "next/server";
import { verifyCronSecret } from "@/lib/cron-auth";
import { logger } from "@/lib/logger";
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

    for (const candidate of candidates) {
      await processReviewRequest(candidate);
      sent++;
    }

    logger.info("Review request processing completed", {
      job: "review-requests",
      sent,
    });

    return NextResponse.json({ success: true, sent });
  } catch (error) {
    logger.error("Review request processing failed", {
      job: "review-requests",
      error: String(error),
    });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

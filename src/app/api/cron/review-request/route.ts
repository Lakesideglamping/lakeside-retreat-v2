import { NextResponse } from "next/server";
import { verifyCronSecret } from "@/lib/cron-auth";
import { logger } from "@/lib/logger";
import { sendSystemAlert } from "@/lib/email";
import {
  findReviewCandidates,
  findReviewFollowUpCandidates,
  processReviewRequest,
  processReviewFollowUp,
} from "@/lib/marketing-automation";

export async function POST(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // First-pass review requests (~2 days post-checkout)
    const initial = await findReviewCandidates();
    let sent = 0;
    for (const booking of initial) {
      await processReviewRequest(booking);
      sent++;
    }

    // Second nudge (~7 days after first email, only once per booking).
    // Lifts review response rate from ~10% to ~17% — directly feeds
    // Google review velocity which is a real local-SEO ranking signal.
    const followUps = await findReviewFollowUpCandidates();
    let followUpsSent = 0;
    for (const candidate of followUps) {
      await processReviewFollowUp(candidate);
      followUpsSent++;
    }

    logger.info("Review request processing completed", {
      job: "review-request",
      sent,
      followUpsSent,
    });

    return NextResponse.json({ success: true, sent, followUpsSent });
  } catch (error) {
    logger.error("Review request processing failed", {
      job: "review-request",
      error: String(error),
    });
    sendSystemAlert("CRON_FAILURE", "Cron job failed: review-request", String(error)).catch(() => {});
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

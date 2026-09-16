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
    // Post-stay thank-you and review ask, on departure day.
    const candidates = await findReviewCandidates();

    let sent = 0;
    let skipped = 0;
    const failures: string[] = [];

    // One booking per try/catch. processReviewRequest throws on failure, so
    // without this a single bad address ends the loop and every guest behind
    // it silently gets nothing. Counting is per outcome rather than per
    // iteration — the previous version incremented `sent` for every booking
    // regardless, so a run where every send failed still reported success.
    for (const booking of candidates) {
      try {
        const outcome = await processReviewRequest(booking);
        if (outcome === "sent") sent++;
        else skipped++;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        logger.error("Review request email failed for booking", {
          job: "review-request",
          bookingId: booking.id,
          error: message,
        });
        failures.push(`${booking.id}: ${message}`);
      }
    }

    logger.info("Review request processing completed", {
      job: "review-request",
      sent,
      skipped,
      failed: failures.length,
    });

    // Alert once for the batch, after every booking has had its turn.
    //
    // This is the only signal a failure produces. The finder looks at a single
    // day's departures, so a booking missed today is never offered again — the
    // guest just never hears from us, and nothing else would say so.
    if (failures.length > 0) {
      sendSystemAlert(
        "CRON_FAILURE",
        `Review request: ${failures.length} of ${candidates.length} email(s) failed`,
        `${failures.join("\n")}\n\nThese guests will NOT be retried — the job only looks at same-day departures. Follow up manually if the review still matters.`
      ).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      sent,
      skipped,
      failed: failures.length,
    });
  } catch (error) {
    logger.error("Review request processing failed", {
      job: "review-request",
      error: String(error),
    });
    sendSystemAlert("CRON_FAILURE", "Cron job failed: review-request", String(error)).catch(() => {});
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

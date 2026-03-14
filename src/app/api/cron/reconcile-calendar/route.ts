import { NextResponse } from "next/server";
import { verifyCronSecret } from "@/lib/cron-auth";
import { logger } from "@/lib/logger";
import { sendSystemAlert } from "@/lib/email";
import { isConfigured, fetchBlockedDates } from "@/lib/uplisting";

const ACCOMMODATIONS = ["dome-pinot", "dome-rose", "lakeside-cottage"] as const;

export async function POST(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    if (!isConfigured()) {
      logger.warn("Calendar reconcile skipped: Uplisting not configured");
      return NextResponse.json({
        success: true,
        synced: 0,
        message: "Uplisting not configured",
      });
    }

    let totalSynced = 0;

    for (const accommodation of ACCOMMODATIONS) {
      const blockedDates = await fetchBlockedDates(accommodation);
      totalSynced += blockedDates.length;
      logger.info("Calendar synced for property", {
        accommodation,
        blockedDates: blockedDates.length,
      });
    }

    logger.info("Calendar reconciliation completed", {
      job: "reconcile-calendar",
      synced: totalSynced,
    });

    return NextResponse.json({ success: true, synced: totalSynced });
  } catch (error) {
    logger.error("Calendar reconciliation failed", {
      job: "reconcile-calendar",
      error: String(error),
    });
    sendSystemAlert("CRON_FAILURE", "Cron job failed: reconcile-calendar", String(error)).catch(() => {});
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { verifyCronSecret } from "@/lib/cron-auth";
import { logger } from "@/lib/logger";
import { sendSystemAlert } from "@/lib/email";
import { prisma } from "@/lib/db";
import { stripe, isDevMode } from "@/lib/stripe";

// Runs periodically. Cancels any security-deposit PaymentIntent whose
// deposit_release_due has passed and the deposit is still "held". Stripe's
// payment_intent.canceled webhook then updates the row to "released".
export async function GET(request: Request) {
  return POST(request);
}

export async function POST(request: Request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isDevMode || !stripe) {
    return NextResponse.json({ success: true, released: 0, devMode: true });
  }

  const nowIso = new Date().toISOString();
  let released = 0;
  let errors = 0;

  try {
    const due = await prisma.bookings.findMany({
      where: {
        security_deposit_status: "held",
        deposit_release_due: { lte: nowIso, not: null },
        deleted_at: null,
      },
      select: {
        id: true,
        security_deposit_intent_id: true,
        guest_email: true,
      },
      take: 100,
    });

    for (const b of due) {
      if (!b.security_deposit_intent_id) continue;
      try {
        await stripe.paymentIntents.cancel(b.security_deposit_intent_id);
        released += 1;
        logger.info("Deposit released", {
          bookingId: b.id,
          pi: b.security_deposit_intent_id,
        });
      } catch (err) {
        errors += 1;
        logger.error("Deposit release failed", {
          bookingId: b.id,
          pi: b.security_deposit_intent_id,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    // Retry any failed webhook events that are still unresolved, up to 5 times.
    const failed = await prisma.failed_webhook_events.findMany({
      where: { resolved: false, retry_count: { lt: 5 } },
      take: 50,
    });

    for (const evt of failed) {
      try {
        await prisma.failed_webhook_events.update({
          where: { id: evt.id },
          data: {
            retry_count: { increment: 1 },
            last_retry_at: new Date(),
          },
        });
        logger.info("Webhook event queued for retry", {
          eventId: evt.event_id,
          attempt: (evt.retry_count ?? 0) + 1,
        });
      } catch (err) {
        logger.error("Webhook retry bookkeeping failed", {
          eventId: evt.event_id,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    if (errors > 0) {
      sendSystemAlert(
        "CRON_DEPOSIT_RELEASE_PARTIAL",
        `Deposit release cron finished with ${errors} failures`,
        `Released: ${released}\nErrors: ${errors}`
      ).catch(() => {});
    }

    return NextResponse.json({ success: true, released, errors });
  } catch (err) {
    logger.error("release-deposits cron failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    sendSystemAlert(
      "CRON_FAILURE",
      "release-deposits cron failed",
      err instanceof Error ? err.message : String(err)
    ).catch(() => {});
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

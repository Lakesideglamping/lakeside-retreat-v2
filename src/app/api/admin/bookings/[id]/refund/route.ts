import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withAdminMutation, getClientIp } from "@/lib/admin-route";
import { stripe, isDevMode } from "@/lib/stripe";
import { auditLog } from "@/lib/audit";
import { logger } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: RouteParams) {
  return withAdminMutation(request, async (admin, req) => {
    // Tight limit: 5 refunds per 15 minutes per admin.
    const limit = await checkRateLimit(`admin_refund:${admin.username}`, 15 * 60 * 1000, 5);
    if (!limit.success) {
      return NextResponse.json({ error: "Too many refund attempts — wait 15 minutes" }, { status: 429 });
    }

    const { id } = await params;

    const booking = await prisma.bookings.findFirst({
      where: { id, deleted_at: null },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (!booking.stripe_payment_id) {
      return NextResponse.json(
        { error: "Booking has no associated Stripe payment" },
        { status: 400 }
      );
    }

    const ip = getClientIp(req);

    if (isDevMode || !stripe) {
      // Mock success when Stripe is not configured
      const updated = await prisma.bookings.update({
        where: { id },
        data: {
          payment_status: "refunded",
          updated_at: new Date(),
        },
      });

      await auditLog(admin.username, "booking_refunded", {
        bookingId: id,
        stripePaymentId: booking.stripe_payment_id,
        mode: "mock",
        note: "Stripe not configured — mock refund processed",
      }, ip);

      return NextResponse.json({
        ...updated,
        refund: { id: "mock_refund_" + Date.now(), status: "succeeded" },
      });
    }

    try {
      // Idempotency key prevents double refunds if the admin double-clicks
      // or the request is retried. Key includes the refund amount slot
      // ("full" today, a cents integer when partial refunds are added) so
      // future partial refunds against the same PI won't collide with the
      // historical full-refund key.
      const refundAmountKey = "full";
      const refund = await stripe.refunds.create(
        { payment_intent: booking.stripe_payment_id },
        {
          idempotencyKey: `refund_${id}_${booking.stripe_payment_id}_${refundAmountKey}`,
        }
      );

      const updated = await prisma.bookings.update({
        where: { id },
        data: {
          payment_status: "refunded",
          updated_at: new Date(),
        },
      });

      await auditLog(admin.username, "booking_refunded", {
        bookingId: id,
        stripePaymentId: booking.stripe_payment_id,
        refundId: refund.id,
        refundStatus: refund.status,
        amount: refund.amount,
      }, ip);

      return NextResponse.json({ ...updated, refund });
    } catch (error) {
      logger.error("Stripe refund error", { err: error });
      await auditLog(
        admin.username,
        "booking_refund_failed",
        {
          bookingId: id,
          stripePaymentId: booking.stripe_payment_id,
          error: error instanceof Error ? error.message : "Unknown error",
        },
        ip
      );
      // Generic message to the client — full error is only in server logs + audit.
      return NextResponse.json({ error: "Refund failed" }, { status: 500 });
    }
  });
}

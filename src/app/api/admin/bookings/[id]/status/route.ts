import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withAdminMutation, getClientIp } from "@/lib/admin-route";
import { statusUpdateSchema } from "@/lib/admin-validations";
import { auditLog } from "@/lib/audit";
import { stripe, isDevMode } from "@/lib/stripe";

type RouteParams = { params: Promise<{ id: string }> };

// Payment statuses that indicate funds are held/captured with Stripe and
// therefore need a refund when the booking is cancelled.
const REFUNDABLE_PAYMENT_STATUSES = new Set(["paid", "authorized"]);

export async function PUT(request: Request, { params }: RouteParams) {
  return withAdminMutation(request, async (admin, req) => {
    const { id } = await params;

    const booking = await prisma.bookings.findFirst({
      where: { id, deleted_at: null },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = statusUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { status } = parsed.data;
    const previousStatus = booking.status;

    const auditDetails: Record<string, unknown> = {
      bookingId: id,
      previousStatus,
      newStatus: status,
    };

    // If we're cancelling a booking that has a live Stripe payment, issue the
    // refund *before* marking the booking cancelled. If the refund fails we
    // fail the whole request — the previous behaviour just added a note and
    // left the money sitting in Stripe forever.
    const needsRefund =
      status === "cancelled" &&
      booking.stripe_payment_id &&
      booking.payment_status &&
      REFUNDABLE_PAYMENT_STATUSES.has(booking.payment_status);

    let refundId: string | null = null;
    if (needsRefund) {
      auditDetails.stripePaymentId = booking.stripe_payment_id;

      if (isDevMode || !stripe) {
        // In dev mode (no Stripe key), record a mock refund so the flow still
        // works locally without leaving the booking in a confusing state.
        refundId = `mock_refund_${Date.now()}`;
        auditDetails.refundMode = "mock";
      } else {
        try {
          const refund = await stripe.refunds.create({
            payment_intent: booking.stripe_payment_id!,
          });
          refundId = refund.id;
          auditDetails.refundId = refund.id;
          auditDetails.refundStatus = refund.status;
          auditDetails.refundAmount = refund.amount;
        } catch (refundErr) {
          console.error("[booking status] Refund failed:", refundErr);
          await auditLog(
            admin.username,
            "booking_cancel_refund_failed",
            {
              bookingId: id,
              stripePaymentId: booking.stripe_payment_id,
              error:
                refundErr instanceof Error
                  ? refundErr.message
                  : "Unknown refund error",
            },
            getClientIp(req)
          );
          return NextResponse.json(
            {
              error:
                "Refund failed — booking was NOT cancelled. Try again or process the refund manually in Stripe before cancelling.",
            },
            { status: 502 }
          );
        }
      }
    }

    const updated = await prisma.bookings.update({
      where: { id },
      data: {
        status,
        ...(needsRefund ? { payment_status: "refunded" } : {}),
        updated_at: new Date(),
      },
    });

    const ip = getClientIp(req);
    await auditLog(admin.username, "booking_status_updated", auditDetails, ip);

    return NextResponse.json({
      ...updated,
      refund: refundId ? { id: refundId } : null,
    });
  });
}

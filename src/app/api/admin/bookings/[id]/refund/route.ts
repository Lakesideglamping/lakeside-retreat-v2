import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withAdminMutation, getClientIp } from "@/lib/admin-route";
import { stripe, isDevMode } from "@/lib/stripe";
import { auditLog } from "@/lib/audit";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: RouteParams) {
  return withAdminMutation(request, async (admin, req) => {
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
      const refund = await stripe.refunds.create({
        payment_intent: booking.stripe_payment_id,
      });

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
      console.error("Stripe refund error:", error);
      const message =
        error instanceof Error ? error.message : "Refund failed";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  });
}

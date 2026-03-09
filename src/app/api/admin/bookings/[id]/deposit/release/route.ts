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

    // Cancel the uncaptured deposit hold on Stripe
    // After partial capture, the uncaptured portion (deposit) can be released
    // by canceling the remaining amount on the payment intent
    if (!isDevMode && stripe && booking.security_deposit_intent_id) {
      try {
        await stripe.paymentIntents.cancel(booking.security_deposit_intent_id);
      } catch (stripeErr) {
        // If cancel fails (e.g., already captured/expired), log but continue
        // The hold will auto-expire per Stripe's 7-day policy
        console.warn("[deposit/release] Stripe cancel (non-fatal):", stripeErr);
      }
    }

    const updated = await prisma.bookings.update({
      where: { id },
      data: {
        security_deposit_status: "released",
        security_deposit_released_at: new Date(),
        updated_at: new Date(),
      },
    });

    const ip = getClientIp(req);
    await auditLog(admin.username, "deposit_released", {
      bookingId: id,
      depositAmount: booking.security_deposit_amount?.toString() ?? null,
      guestName: booking.guest_name,
      stripeCancel: !isDevMode && stripe ? "attempted" : "skipped",
    }, ip);

    return NextResponse.json(updated);
  });
}

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

    // Cancel the deposit hold on Stripe. The deposit is a dedicated off-session
    // PaymentIntent (capture_method: manual) — canceling it releases the auth
    // immediately. Non-fatal on error: if it's already released/expired we still
    // mark the booking row as released so the admin UI stays consistent.
    if (!isDevMode && stripe && booking.security_deposit_intent_id) {
      try {
        await stripe.paymentIntents.cancel(booking.security_deposit_intent_id);
      } catch (stripeErr) {
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

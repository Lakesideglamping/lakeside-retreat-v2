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

    const body = await req.json().catch(() => ({}));
    const claimAmount = body.amount ?? booking.security_deposit_amount;

    if (claimAmount === null || claimAmount === undefined) {
      return NextResponse.json(
        { error: "No deposit amount available to claim" },
        { status: 400 }
      );
    }

    const ip = getClientIp(req);

    // Actually capture the deposit via Stripe
    if (!isDevMode && stripe && booking.security_deposit_intent_id) {
      try {
        await stripe.paymentIntents.capture(
          booking.security_deposit_intent_id,
          { amount_to_capture: Math.round(Number(claimAmount) * 100) }
        );
      } catch (stripeErr) {
        console.error("[deposit/claim] Stripe capture error:", stripeErr);

        // If the intent was already fully captured or expired, try the main payment intent
        if (booking.stripe_payment_id) {
          try {
            await stripe.paymentIntents.capture(
              booking.stripe_payment_id,
              { amount_to_capture: Math.round(Number(claimAmount) * 100) }
            );
          } catch (fallbackErr) {
            console.error("[deposit/claim] Fallback capture error:", fallbackErr);
            const message = fallbackErr instanceof Error ? fallbackErr.message : "Stripe capture failed";
            return NextResponse.json({ error: `Stripe capture failed: ${message}` }, { status: 500 });
          }
        } else {
          const message = stripeErr instanceof Error ? stripeErr.message : "Stripe capture failed";
          return NextResponse.json({ error: `Stripe capture failed: ${message}` }, { status: 500 });
        }
      }
    }

    const updated = await prisma.bookings.update({
      where: { id },
      data: {
        security_deposit_status: "claimed",
        security_deposit_claimed_amount: claimAmount,
        updated_at: new Date(),
      },
    });

    await auditLog(admin.username, "deposit_claimed", {
      bookingId: id,
      claimedAmount: claimAmount,
      totalDeposit: booking.security_deposit_amount?.toString() ?? null,
      guestName: booking.guest_name,
      stripeCapture: !isDevMode && stripe ? "attempted" : "skipped",
    }, ip);

    return NextResponse.json(updated);
  });
}

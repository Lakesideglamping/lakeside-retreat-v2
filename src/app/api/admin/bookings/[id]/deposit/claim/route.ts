import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withAdminMutation, getClientIp } from "@/lib/admin-route";
import { stripe, isDevMode } from "@/lib/stripe";
import { auditLog } from "@/lib/audit";
import { checkRateLimit } from "@/lib/rate-limit";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: RouteParams) {
  return withAdminMutation(request, async (admin, req) => {
    // Tight limit: 5 deposit claims per 15 minutes per admin.
    const limit = await checkRateLimit(`admin_deposit_claim:${admin.username}`, 15 * 60 * 1000, 5);
    if (!limit.success) {
      return NextResponse.json({ error: "Too many deposit claim attempts — wait 15 minutes" }, { status: 429 });
    }

    const { id } = await params;

    const booking = await prisma.bookings.findFirst({
      where: { id, deleted_at: null },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // A claim is only valid when a hold still exists. If the deposit was
    // already released or already claimed, trying again either no-ops on
    // Stripe or fails — either way we should refuse at the application layer.
    const currentStatus = booking.security_deposit_status;
    if (currentStatus !== "pending" && currentStatus !== "held") {
      return NextResponse.json(
        { error: `Cannot claim deposit in status "${currentStatus ?? "unknown"}"` },
        { status: 409 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const claimAmount = body.amount ?? booking.security_deposit_amount;
    const reason: string | null =
      typeof body.reason === "string" && body.reason.trim() ? body.reason.trim() : null;

    if (claimAmount === null || claimAmount === undefined) {
      return NextResponse.json(
        { error: "No deposit amount available to claim" },
        { status: 400 }
      );
    }

    if (!reason) {
      return NextResponse.json(
        { error: "A reason is required when claiming a deposit" },
        { status: 400 }
      );
    }

    const ip = getClientIp(req);

    // Capture the deposit hold. The deposit PI is a separate auth-only
    // PaymentIntent created by the webhook after checkout — capturing it here
    // actually charges the guest. No fallback: if it fails, the hold either
    // expired (Stripe 7-day limit) or was already released.
    if (!isDevMode && stripe && booking.security_deposit_intent_id) {
      try {
        await stripe.paymentIntents.capture(
          booking.security_deposit_intent_id,
          { amount_to_capture: Math.round(Number(claimAmount) * 100) }
        );
      } catch (stripeErr) {
        await auditLog(
          admin.username,
          "deposit_claim_failed",
          {
            bookingId: id,
            stripeIntentId: booking.security_deposit_intent_id,
            error:
              stripeErr instanceof Error ? stripeErr.message : "Unknown error",
          },
          ip
        );
        return NextResponse.json(
          { error: "Stripe capture failed" },
          { status: 500 }
        );
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
      reason,
      stripeCapture: !isDevMode && stripe ? "attempted" : "skipped",
    }, ip);

    return NextResponse.json(updated);
  });
}

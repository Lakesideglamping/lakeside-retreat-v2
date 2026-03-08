import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withAdminMutation, getClientIp } from "@/lib/admin-route";
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

    const updated = await prisma.bookings.update({
      where: { id },
      data: {
        security_deposit_status: "claimed",
        security_deposit_claimed_amount: claimAmount,
        updated_at: new Date(),
      },
    });

    const ip = getClientIp(req);
    await auditLog(admin.username, "deposit_claimed", {
      bookingId: id,
      claimedAmount: claimAmount,
      totalDeposit: booking.security_deposit_amount?.toString() ?? null,
      guestName: booking.guest_name,
    }, ip);

    return NextResponse.json(updated);
  });
}

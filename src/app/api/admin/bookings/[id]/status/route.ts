import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withAdminMutation, getClientIp } from "@/lib/admin-route";
import { statusUpdateSchema } from "@/lib/admin-validations";
import { auditLog } from "@/lib/audit";

type RouteParams = { params: Promise<{ id: string }> };

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

    if (status === "cancelled" && booking.stripe_payment_id) {
      auditDetails.hasPayment = true;
      auditDetails.stripePaymentId = booking.stripe_payment_id;
      auditDetails.note = "Booking has an associated payment. Consider processing a refund.";
    }

    const updated = await prisma.bookings.update({
      where: { id },
      data: {
        status,
        updated_at: new Date(),
      },
    });

    const ip = getClientIp(req);
    await auditLog(admin.username, "booking_status_updated", auditDetails, ip);

    return NextResponse.json(updated);
  });
}

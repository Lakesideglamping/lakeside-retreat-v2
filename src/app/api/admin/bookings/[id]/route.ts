import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withAdmin, withAdminMutation, getClientIp } from "@/lib/admin-route";
import { bookingUpdateSchema } from "@/lib/admin-validations";
import { auditLog } from "@/lib/audit";
import type { Prisma } from "@/generated/prisma/client";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteParams) {
  return withAdmin(request, async () => {
    const { id } = await params;

    const booking = await prisma.bookings.findFirst({
      where: { id, deleted_at: null },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    return NextResponse.json(booking);
  });
}

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
    const parsed = bookingUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const updateData: Prisma.bookingsUpdateInput = {
      updated_at: new Date(),
    };

    if (data.guest_name !== undefined) updateData.guest_name = data.guest_name;
    if (data.guest_email !== undefined) updateData.guest_email = data.guest_email;
    if (data.guest_phone !== undefined) updateData.guest_phone = data.guest_phone;
    if (data.accommodation !== undefined) updateData.accommodation = data.accommodation;
    if (data.check_in !== undefined) updateData.check_in = new Date(data.check_in);
    if (data.check_out !== undefined) updateData.check_out = new Date(data.check_out);
    if (data.guests !== undefined) updateData.guests = data.guests;
    if (data.total_price !== undefined) updateData.total_price = data.total_price;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.payment_status !== undefined) updateData.payment_status = data.payment_status;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.booking_source !== undefined) updateData.booking_source = data.booking_source;

    const updated = await prisma.bookings.update({
      where: { id },
      data: updateData,
    });

    const ip = getClientIp(req);
    await auditLog(admin.username, "booking_updated", {
      bookingId: id,
      changes: data,
    }, ip);

    return NextResponse.json(updated);
  });
}

export async function DELETE(request: Request, { params }: RouteParams) {
  return withAdminMutation(request, async (admin, req) => {
    const { id } = await params;

    const booking = await prisma.bookings.findFirst({
      where: { id, deleted_at: null },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    await prisma.bookings.update({
      where: { id },
      data: { deleted_at: new Date() },
    });

    const ip = getClientIp(req);
    await auditLog(admin.username, "booking_deleted", {
      bookingId: id,
      guestName: booking.guest_name,
      accommodation: booking.accommodation,
    }, ip);

    return NextResponse.json({ success: true });
  });
}

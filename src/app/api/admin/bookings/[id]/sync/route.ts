import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withAdminMutation, getClientIp } from "@/lib/admin-route";
import { syncBooking, isConfigured } from "@/lib/uplisting";
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

    const ip = getClientIp(req);

    if (!isConfigured()) {
      await prisma.bookings.update({
        where: { id },
        data: {
          uplisting_sync_status: "skipped",
          updated_at: new Date(),
        },
      });

      await auditLog(admin.username, "booking_sync_attempted", {
        bookingId: id,
        result: "skipped",
        reason: "Uplisting not configured",
      }, ip);

      return NextResponse.json({
        success: false,
        message: "Uplisting is not configured",
      });
    }

    try {
      await syncBooking({
        accommodation: booking.accommodation,
        checkIn: booking.check_in.toISOString().split("T")[0],
        checkOut: booking.check_out.toISOString().split("T")[0],
        guestName: booking.guest_name,
        guestEmail: booking.guest_email,
        guestPhone: booking.guest_phone ?? undefined,
        guests: booking.guests,
      });

      const updated = await prisma.bookings.update({
        where: { id },
        data: {
          uplisting_sync_status: "synced",
          updated_at: new Date(),
        },
      });

      await auditLog(admin.username, "booking_synced", {
        bookingId: id,
        accommodation: booking.accommodation,
        result: "success",
      }, ip);

      return NextResponse.json({ success: true, booking: updated });
    } catch (error) {
      console.error("Uplisting sync error:", error);

      await prisma.bookings.update({
        where: { id },
        data: {
          uplisting_sync_status: "failed",
          updated_at: new Date(),
        },
      });

      await auditLog(admin.username, "booking_sync_failed", {
        bookingId: id,
        error: error instanceof Error ? error.message : "Unknown error",
      }, ip);

      // Generic message to the client — full error is only in server logs + audit.
      return NextResponse.json(
        { success: false, error: "Sync failed" },
        { status: 500 }
      );
    }
  });
}

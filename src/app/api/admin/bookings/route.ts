import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withAdmin, withAdminMutation, getClientIp } from "@/lib/admin-route";
import { bookingCreateSchema } from "@/lib/admin-validations";
import { auditLog } from "@/lib/audit";
import type { Prisma } from "@/generated/prisma/client";

export async function GET(request: Request) {
  return withAdmin(request, async (admin, req) => {
    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "20", 10)));
    const status = url.searchParams.get("status");
    const search = url.searchParams.get("search");
    const accommodation = url.searchParams.get("accommodation");
    const dateFrom = url.searchParams.get("dateFrom");
    const dateTo = url.searchParams.get("dateTo");
    const source = url.searchParams.get("source");

    const where: Prisma.bookingsWhereInput = {
      deleted_at: null,
    };

    if (status) {
      where.status = status;
    }

    if (accommodation) {
      where.accommodation = accommodation;
    }

    if (source) {
      where.booking_source = source;
    }

    if (search) {
      where.OR = [
        { guest_name: { contains: search, mode: "insensitive" } },
        { guest_email: { contains: search, mode: "insensitive" } },
      ];
    }

    if (dateFrom || dateTo) {
      where.check_in = {};
      if (dateFrom) {
        where.check_in.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.check_in.lte = new Date(dateTo);
      }
    }

    const skip = (page - 1) * limit;

    // Sort: upcoming/current bookings first (nearest check-in), then past
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcomingWhere = { ...where, check_out: { gte: today } };
    const pastWhere = { ...where, check_out: { lt: today } };

    const [upcomingCount, pastCount] = await Promise.all([
      prisma.bookings.count({ where: upcomingWhere }),
      prisma.bookings.count({ where: pastWhere }),
    ]);

    const total = upcomingCount + pastCount;
    let bookings: Awaited<ReturnType<typeof prisma.bookings.findMany>> = [];

    if (skip < upcomingCount) {
      // Page starts within upcoming bookings
      const upcomingTake = Math.min(limit, upcomingCount - skip);
      const upcomingResults = await prisma.bookings.findMany({
        where: upcomingWhere,
        orderBy: [{ check_in: "asc" }],
        skip,
        take: upcomingTake,
      });
      bookings.push(...upcomingResults);

      // Fill remaining slots from past bookings if needed
      const remaining = limit - upcomingResults.length;
      if (remaining > 0) {
        const pastResults = await prisma.bookings.findMany({
          where: pastWhere,
          orderBy: [{ check_in: "desc" }],
          skip: 0,
          take: remaining,
        });
        bookings.push(...pastResults);
      }
    } else {
      // Page starts within past bookings
      const pastSkip = skip - upcomingCount;
      bookings = await prisma.bookings.findMany({
        where: pastWhere,
        orderBy: [{ check_in: "desc" }],
        skip: pastSkip,
        take: limit,
      });
    }

    return NextResponse.json({
      bookings,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  });
}

export async function POST(request: Request) {
  return withAdminMutation(request, async (admin, req) => {
    const body = await req.json();
    const parsed = bookingCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const booking = await prisma.bookings.create({
      data: {
        id: crypto.randomUUID(),
        guest_name: data.guest_name,
        guest_email: data.guest_email,
        guest_phone: data.guest_phone ?? null,
        accommodation: data.accommodation,
        check_in: new Date(data.check_in),
        check_out: new Date(data.check_out),
        guests: data.guests,
        total_price: data.total_price ?? null,
        status: data.status ?? "confirmed",
        notes: data.notes ?? null,
        booking_source: "manual",
      },
    });

    const ip = getClientIp(req);
    await auditLog(admin.username, "booking_created", {
      bookingId: booking.id,
      guestName: booking.guest_name,
      accommodation: booking.accommodation,
      checkIn: data.check_in,
      checkOut: data.check_out,
    }, ip);

    return NextResponse.json(booking, { status: 201 });
  });
}

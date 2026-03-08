import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withAdminMutation, getClientIp } from "@/lib/admin-route";
import { seasonalRateSchema } from "@/lib/admin-validations";
import { auditLog } from "@/lib/audit";

type RouteParams = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: RouteParams) {
  return withAdminMutation(request, async (admin, req) => {
    const { id } = await params;
    const numericId = parseInt(id, 10);

    if (isNaN(numericId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const existing = await prisma.seasonal_rates.findUnique({
      where: { id: numericId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Seasonal rate not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const parsed = seasonalRateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    if (new Date(data.end_date) < new Date(data.start_date)) {
      return NextResponse.json(
        { error: "End date must be after start date" },
        { status: 400 }
      );
    }

    const updated = await prisma.seasonal_rates.update({
      where: { id: numericId },
      data: {
        name: data.name,
        start_date: new Date(data.start_date),
        end_date: new Date(data.end_date),
        multiplier: data.multiplier,
        is_active: data.is_active ?? existing.is_active,
        updated_at: new Date(),
      },
    });

    const ip = getClientIp(req);
    await auditLog(admin.username, "seasonal_rate_updated", {
      rateId: numericId,
      changes: data,
    }, ip);

    return NextResponse.json(updated);
  });
}

export async function DELETE(request: Request, { params }: RouteParams) {
  return withAdminMutation(request, async (admin, req) => {
    const { id } = await params;
    const numericId = parseInt(id, 10);

    if (isNaN(numericId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const existing = await prisma.seasonal_rates.findUnique({
      where: { id: numericId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Seasonal rate not found" },
        { status: 404 }
      );
    }

    await prisma.seasonal_rates.delete({
      where: { id: numericId },
    });

    const ip = getClientIp(req);
    await auditLog(admin.username, "seasonal_rate_deleted", {
      rateId: numericId,
      name: existing.name,
    }, ip);

    return NextResponse.json({ success: true });
  });
}

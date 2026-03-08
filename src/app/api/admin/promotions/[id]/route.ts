import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withAdminMutation, getClientIp } from "@/lib/admin-route";
import { promoCodeSchema } from "@/lib/admin-validations";
import { auditLog } from "@/lib/audit";

type RouteParams = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: RouteParams) {
  return withAdminMutation(request, async (admin, req) => {
    const { id } = await params;
    const promoId = parseInt(id, 10);

    if (isNaN(promoId)) {
      return NextResponse.json({ error: "Invalid promo code ID" }, { status: 400 });
    }

    const promo = await prisma.promo_codes.findUnique({
      where: { id: promoId },
    });

    if (!promo) {
      return NextResponse.json({ error: "Promo code not found" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = promoCodeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Check for duplicate code if code changed
    if (data.code.toUpperCase() !== promo.code) {
      const existing = await prisma.promo_codes.findUnique({
        where: { code: data.code.toUpperCase() },
      });
      if (existing) {
        return NextResponse.json(
          { error: "A promo code with this code already exists" },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.promo_codes.update({
      where: { id: promoId },
      data: {
        name: data.name,
        code: data.code.toUpperCase(),
        type: data.type ?? "general",
        description: data.description ?? null,
        discount_type: data.discount_type,
        discount_value: data.discount_value,
        valid_from: data.valid_from ? new Date(data.valid_from) : null,
        valid_until: data.valid_until ? new Date(data.valid_until) : null,
        min_stay: data.min_stay ?? null,
        usage_limit: data.usage_limit ?? null,
        status: data.status ?? promo.status,
        partner_info: data.partner_info ?? null,
        updated_at: new Date(),
      },
    });

    const ip = getClientIp(req);
    await auditLog(admin.username, "promo_code_updated", {
      promoCodeId: promoId,
      changes: data,
    }, ip);

    return NextResponse.json(updated);
  });
}

export async function DELETE(request: Request, { params }: RouteParams) {
  return withAdminMutation(request, async (admin, req) => {
    const { id } = await params;
    const promoId = parseInt(id, 10);

    if (isNaN(promoId)) {
      return NextResponse.json({ error: "Invalid promo code ID" }, { status: 400 });
    }

    const promo = await prisma.promo_codes.findUnique({
      where: { id: promoId },
    });

    if (!promo) {
      return NextResponse.json({ error: "Promo code not found" }, { status: 404 });
    }

    await prisma.promo_codes.delete({
      where: { id: promoId },
    });

    const ip = getClientIp(req);
    await auditLog(admin.username, "promo_code_deleted", {
      promoCodeId: promoId,
      name: promo.name,
      code: promo.code,
    }, ip);

    return NextResponse.json({ success: true });
  });
}

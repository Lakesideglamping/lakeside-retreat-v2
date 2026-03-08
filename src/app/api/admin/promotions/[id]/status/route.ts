import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withAdminMutation, getClientIp } from "@/lib/admin-route";
import { auditLog } from "@/lib/audit";
import { z } from "zod";

const statusSchema = z.object({
  status: z.enum(["active", "paused", "expired"]),
});

type RouteParams = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: RouteParams) {
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
    const parsed = statusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updated = await prisma.promo_codes.update({
      where: { id: promoId },
      data: {
        status: parsed.data.status,
        updated_at: new Date(),
      },
    });

    const ip = getClientIp(req);
    await auditLog(admin.username, "promo_code_status_changed", {
      promoCodeId: promoId,
      code: promo.code,
      oldStatus: promo.status,
      newStatus: parsed.data.status,
    }, ip);

    return NextResponse.json(updated);
  });
}

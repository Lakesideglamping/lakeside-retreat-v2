import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withAdmin, withAdminMutation, getClientIp } from "@/lib/admin-route";
import { promoCodeSchema } from "@/lib/admin-validations";
import { auditLog } from "@/lib/audit";
import type { Prisma } from "@/generated/prisma/client";

export async function GET(request: Request) {
  return withAdmin(request, async (_admin, req) => {
    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "20", 10)));
    const status = url.searchParams.get("status");
    const type = url.searchParams.get("type");
    const search = url.searchParams.get("search");

    const where: Prisma.promo_codesWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
      ];
    }

    const skip = (page - 1) * limit;

    // Totals span all rows (ignoring filters/pagination) so the stat cards
     // reflect the whole dataset, not just the current page.
    const [promoCodes, total, activeCount, usageAgg] = await Promise.all([
      prisma.promo_codes.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
      }),
      prisma.promo_codes.count({ where }),
      prisma.promo_codes.count({ where: { status: "active" } }),
      prisma.promo_codes.aggregate({ _sum: { usage_count: true } }),
    ]);

    return NextResponse.json({
      promoCodes,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      activeCount,
      totalUsage: usageAgg._sum.usage_count ?? 0,
    });
  });
}

export async function POST(request: Request) {
  return withAdminMutation(request, async (admin, req) => {
    const body = await req.json();
    const parsed = promoCodeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Check for duplicate code
    const existing = await prisma.promo_codes.findUnique({
      where: { code: data.code.toUpperCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A promo code with this code already exists" },
        { status: 409 }
      );
    }

    const promoCode = await prisma.promo_codes.create({
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
        status: data.status ?? "active",
        partner_info: data.partner_info ?? null,
      },
    });

    const ip = getClientIp(req);
    await auditLog(admin.username, "promo_code_created", {
      promoCodeId: promoCode.id,
      name: promoCode.name,
      code: promoCode.code,
    }, ip);

    return NextResponse.json(promoCode, { status: 201 });
  });
}

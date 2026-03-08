import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withAdmin, withAdminMutation, getClientIp } from "@/lib/admin-route";
import { seasonalRateSchema } from "@/lib/admin-validations";
import { auditLog } from "@/lib/audit";

export async function GET(request: Request) {
  return withAdmin(request, async () => {
    const rates = await prisma.seasonal_rates.findMany({
      orderBy: { start_date: "asc" },
    });

    return NextResponse.json({ rates });
  });
}

export async function POST(request: Request) {
  return withAdminMutation(request, async (admin, req) => {
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

    const rate = await prisma.seasonal_rates.create({
      data: {
        name: data.name,
        start_date: new Date(data.start_date),
        end_date: new Date(data.end_date),
        multiplier: data.multiplier,
        is_active: data.is_active ?? true,
      },
    });

    const ip = getClientIp(req);
    await auditLog(admin.username, "seasonal_rate_created", {
      rateId: rate.id,
      name: data.name,
      startDate: data.start_date,
      endDate: data.end_date,
      multiplier: data.multiplier,
    }, ip);

    return NextResponse.json(rate, { status: 201 });
  });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withAdmin, withAdminMutation, getClientIp } from "@/lib/admin-route";
import { blockedDateSchema } from "@/lib/admin-validations";
import { auditLog } from "@/lib/audit";
import { getValidIds } from "@/lib/accommodations";

export async function GET(request: Request) {
  return withAdmin(request, async (_admin, req) => {
    const url = new URL(req.url);
    const property = url.searchParams.get("property");

    const where: Record<string, unknown> = {};

    // Validate against known property slugs — unknown values would silently
    // return 0 rows and mask UI bugs; invalid slugs have no legitimate use.
    if (property) {
      if (!getValidIds().includes(property)) {
        return NextResponse.json({ error: "Invalid property" }, { status: 400 });
      }
      where.property = property;
    }

    const blockedDates = await prisma.blocked_dates.findMany({
      where,
      orderBy: { start_date: "asc" },
    });

    return NextResponse.json({ blockedDates });
  });
}

export async function POST(request: Request) {
  return withAdminMutation(request, async (admin, req) => {
    const body = await req.json();
    const parsed = blockedDateSchema.safeParse(body);

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

    const blocked = await prisma.blocked_dates.create({
      data: {
        property: data.property,
        start_date: new Date(data.start_date),
        end_date: new Date(data.end_date),
        reason: data.reason ?? "maintenance",
        notes: data.notes ?? null,
      },
    });

    const ip = getClientIp(req);
    await auditLog(admin.username, "blocked_date_created", {
      blockedDateId: blocked.id,
      property: data.property,
      startDate: data.start_date,
      endDate: data.end_date,
      reason: data.reason,
    }, ip);

    return NextResponse.json(blocked, { status: 201 });
  });
}

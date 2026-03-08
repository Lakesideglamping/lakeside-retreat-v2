import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withAdminMutation, getClientIp } from "@/lib/admin-route";
import { auditLog } from "@/lib/audit";

type RouteParams = { params: Promise<{ id: string }> };

export async function DELETE(request: Request, { params }: RouteParams) {
  return withAdminMutation(request, async (admin, req) => {
    const { id } = await params;
    const numericId = parseInt(id, 10);

    if (isNaN(numericId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const blocked = await prisma.blocked_dates.findUnique({
      where: { id: numericId },
    });

    if (!blocked) {
      return NextResponse.json(
        { error: "Blocked date not found" },
        { status: 404 }
      );
    }

    await prisma.blocked_dates.delete({
      where: { id: numericId },
    });

    const ip = getClientIp(req);
    await auditLog(admin.username, "blocked_date_deleted", {
      blockedDateId: numericId,
      property: blocked.property,
      startDate: blocked.start_date.toISOString().split("T")[0],
      endDate: blocked.end_date.toISOString().split("T")[0],
    }, ip);

    return NextResponse.json({ success: true });
  });
}

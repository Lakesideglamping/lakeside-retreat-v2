import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { withAdminMutation, getClientIp } from "@/lib/admin-route";
import { auditLog } from "@/lib/audit";

const bulkSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1).max(200),
  action: z.enum(["approve", "reject", "delete", "feature", "unfeature"]),
});

export async function POST(request: Request) {
  return withAdminMutation(request, async (admin, req) => {
    const body = await req.json();
    const parsed = bulkSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { ids, action } = parsed.data;

    const data: Record<string, unknown> = { updated_at: new Date() };
    switch (action) {
      case "approve":
        data.status = "approved";
        break;
      case "reject":
        data.status = "rejected";
        break;
      case "delete":
        data.status = "deleted";
        break;
      case "feature":
        data.is_featured = true;
        data.status = "approved";
        break;
      case "unfeature":
        data.is_featured = false;
        break;
    }

    const result = await prisma.reviews.updateMany({
      where: { id: { in: ids } },
      data,
    });

    const ip = getClientIp(req);
    await auditLog(admin.username, "review_bulk", { ids, action, count: result.count }, ip);

    return NextResponse.json({ success: true, count: result.count });
  });
}

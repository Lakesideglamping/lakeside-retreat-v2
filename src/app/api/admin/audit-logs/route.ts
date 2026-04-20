import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/admin-route";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  return withAdmin(request, async () => {
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get("bookingId");
    const action = searchParams.get("action");
    const limit = Math.min(Number(searchParams.get("limit") ?? 50), 200);
    const offset = Math.max(Number(searchParams.get("offset") ?? 0), 0);

    // audit_logs.details is a JSON-encoded string; filtering on a nested key
    // inside it is done with a substring match against the stringified payload
    // — good enough because the bookingId is a UUID and collisions are nil.
    const where: Record<string, unknown> = {};
    if (action) where.action = action;
    if (bookingId) where.details = { contains: bookingId };

    const [rows, total] = await Promise.all([
      prisma.audit_logs.findMany({
        where,
        orderBy: { created_at: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.audit_logs.count({ where }),
    ]);

    const logs = rows.map((r) => {
      let parsed: unknown = null;
      try {
        parsed = r.details ? JSON.parse(r.details) : null;
      } catch {
        parsed = r.details;
      }
      return {
        id: r.id,
        admin_user: r.admin_user,
        action: r.action,
        details: parsed,
        ip_address: r.ip_address,
        created_at: r.created_at,
      };
    });

    return NextResponse.json({ logs, total, limit, offset });
  });
}

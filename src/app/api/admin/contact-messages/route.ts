import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/admin-route";
import { prisma } from "@/lib/db";

const DEFAULT_PAGE_SIZE = 20;

export async function GET(request: Request) {
  return withAdmin(request, async () => {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") ?? String(DEFAULT_PAGE_SIZE), 10))
    );

    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      prisma.contact_messages.findMany({
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
      }),
      prisma.contact_messages.count(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      messages,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  });
}

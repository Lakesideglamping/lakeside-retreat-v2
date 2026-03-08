import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withAdmin } from "@/lib/admin-route";

export async function GET(request: Request) {
  return withAdmin(request, async () => {
    const [
      total,
      pendingCount,
      featuredCount,
      averageResult,
      byPlatform,
    ] = await Promise.all([
      prisma.reviews.count(),
      prisma.reviews.count({ where: { status: "pending" } }),
      prisma.reviews.count({ where: { is_featured: true } }),
      prisma.reviews.aggregate({ _avg: { rating: true } }),
      prisma.reviews.groupBy({
        by: ["platform"],
        _count: { id: true },
      }),
    ]);

    const platformCounts: Record<string, number> = {};
    for (const entry of byPlatform) {
      platformCounts[entry.platform ?? "direct"] = entry._count.id;
    }

    return NextResponse.json({
      total,
      averageRating: averageResult._avg.rating
        ? Math.round(averageResult._avg.rating * 10) / 10
        : 0,
      pendingCount,
      featuredCount,
      byPlatform: platformCounts,
    });
  });
}

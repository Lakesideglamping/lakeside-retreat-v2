import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withAdmin } from "@/lib/admin-route";

export async function GET(request: Request) {
  return withAdmin(request, async () => {
    // Exclude soft-deleted rows from all counts.
    const notDeleted = { NOT: { status: "deleted" } };
    const [
      total,
      pendingCount,
      featuredCount,
      averageResult,
      byPlatform,
    ] = await Promise.all([
      prisma.reviews.count({ where: notDeleted }),
      prisma.reviews.count({ where: { status: "pending" } }),
      prisma.reviews.count({ where: { is_featured: true, ...notDeleted } }),
      prisma.reviews.aggregate({ where: notDeleted, _avg: { rating: true } }),
      prisma.reviews.groupBy({
        by: ["platform"],
        where: notDeleted,
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

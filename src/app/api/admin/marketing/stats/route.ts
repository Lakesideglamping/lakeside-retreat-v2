import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/admin-route";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  return withAdmin(request, async () => {
    const [reviewRequestCount, socialDraftCount] = await Promise.all([
      prisma.review_requests.count(),
      prisma.social_content_drafts.count(),
    ]);

    return NextResponse.json({
      reviewRequests: reviewRequestCount,
      socialDrafts: socialDraftCount,
    });
  });
}

import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/admin-route";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  return withAdmin(request, async () => {
    const [abandonedCount, reviewRequestCount, socialDraftCount] =
      await Promise.all([
        prisma.abandoned_checkout_reminders.count(),
        prisma.review_requests.count(),
        prisma.social_content_drafts.count(),
      ]);

    return NextResponse.json({
      abandonedCheckouts: abandonedCount,
      reviewRequests: reviewRequestCount,
      socialDrafts: socialDraftCount,
    });
  });
}

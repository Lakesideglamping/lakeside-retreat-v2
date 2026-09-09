import { MarketingContent } from "@/components/admin/marketing/marketing-content";
import { prisma } from "@/lib/db";

export default async function MarketingPage() {
  // Pre-fetch the marketing datasets server-side. Mirrors the pattern
  // used by the dashboard and notifications pages. Without this, the
  // page chrome renders immediately but the tables stay empty for up to
  // 3.6s (fanned-out client fetches after hydration).
  const [reviewRequestCount, socialDraftCount, reviewRequests, socialDrafts] =
    await Promise.all([
      prisma.review_requests.count(),
      prisma.social_content_drafts.count(),
      prisma.review_requests.findMany({ orderBy: { id: "desc" } }),
      prisma.social_content_drafts.findMany({ orderBy: { id: "desc" } }),
    ]);

  return (
    <MarketingContent
      initialData={{
        stats: {
          reviewRequests: reviewRequestCount,
          socialDrafts: socialDraftCount,
        },
        reviewRequests,
        socialDrafts,
      }}
    />
  );
}

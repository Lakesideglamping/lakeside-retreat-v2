import { MarketingContent } from "@/components/admin/marketing/marketing-content";
import { prisma } from "@/lib/db";

export default async function MarketingPage() {
  // Pre-fetch all four marketing datasets server-side. Mirrors the
  // pattern used by the dashboard and notifications pages. Without
  // this, the page chrome renders immediately but the tables stay
  // empty for up to 3.6s (4 fanned-out client fetches after hydration).
  const [
    abandonedCount,
    reviewRequestCount,
    socialDraftCount,
    checkouts,
    reviewRequests,
    socialDrafts,
  ] = await Promise.all([
    prisma.abandoned_checkout_reminders.count(),
    prisma.review_requests.count(),
    prisma.social_content_drafts.count(),
    prisma.abandoned_checkout_reminders.findMany({ orderBy: { id: "desc" } }),
    prisma.review_requests.findMany({ orderBy: { id: "desc" } }),
    prisma.social_content_drafts.findMany({ orderBy: { id: "desc" } }),
  ]);

  return (
    <MarketingContent
      initialData={{
        stats: {
          abandonedCheckouts: abandonedCount,
          reviewRequests: reviewRequestCount,
          socialDrafts: socialDraftCount,
        },
        checkouts,
        reviewRequests,
        socialDrafts,
      }}
    />
  );
}

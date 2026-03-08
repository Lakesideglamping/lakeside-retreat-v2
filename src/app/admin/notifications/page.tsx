import { prisma } from "@/lib/db";
import { NotificationsContent } from "@/components/admin/notifications/notifications-content";

export default async function NotificationsPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [
    failedPayments,
    syncFailures,
    abandonedCheckouts,
    pendingReviews,
    todayCheckIns,
    todayCheckOuts,
    recentMessages,
  ] = await Promise.all([
    prisma.bookings.count({
      where: { deleted_at: null, payment_status: "failed" },
    }),
    prisma.bookings.count({
      where: { deleted_at: null, uplisting_sync_status: "failed" },
    }),
    prisma.abandoned_checkout_reminders.count(),
    prisma.review_requests.count({
      where: { status: "pending" },
    }),
    prisma.bookings.count({
      where: {
        deleted_at: null,
        check_in: { gte: today, lt: tomorrow },
      },
    }),
    prisma.bookings.count({
      where: {
        deleted_at: null,
        check_out: { gte: today, lt: tomorrow },
      },
    }),
    prisma.contact_messages.count({
      where: { created_at: { gte: twentyFourHoursAgo } },
    }),
  ]);

  const notifications = {
    failedPayments,
    syncFailures,
    abandonedCheckouts,
    pendingReviews,
    todayCheckIns,
    todayCheckOuts,
    recentMessages,
  };

  return <NotificationsContent initialData={notifications} />;
}

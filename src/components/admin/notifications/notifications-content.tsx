"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { adminGet } from "@/lib/admin-api";
import { LoadingSpinner } from "@/components/admin/ui/loading-spinner";

interface NotificationData {
  failedPayments: number;
  syncFailures: number;
  abandonedCheckouts: number;
  pendingReviews: number;
  todayCheckIns: number;
  todayCheckOuts: number;
}

interface NotificationItem {
  id: string;
  category: "critical" | "warning" | "info";
  title: string;
  message: string;
  href: string;
  count: number;
}

const categoryStyles = {
  critical: {
    border: "border-l-red-500",
    bg: "bg-red-50",
    badge: "bg-red-100 text-red-700",
    icon: "text-red-500",
    label: "Critical",
    labelBg: "bg-red-100 text-red-800",
  },
  warning: {
    border: "border-l-yellow-500",
    bg: "bg-yellow-50",
    badge: "bg-yellow-100 text-yellow-700",
    icon: "text-yellow-500",
    label: "Warning",
    labelBg: "bg-yellow-100 text-yellow-800",
  },
  info: {
    border: "border-l-blue-500",
    bg: "bg-blue-50",
    badge: "bg-blue-100 text-blue-700",
    icon: "text-blue-500",
    label: "Info",
    labelBg: "bg-blue-100 text-blue-800",
  },
};

function buildNotifications(data: NotificationData): NotificationItem[] {
  const items: NotificationItem[] = [];

  if (data.failedPayments > 0) {
    items.push({
      id: "failed-payments",
      category: "critical",
      title: "Failed Payments",
      message: `${data.failedPayments} booking(s) with failed payments require attention.`,
      href: "/admin/bookings?status=failed",
      count: data.failedPayments,
    });
  }

  if (data.syncFailures > 0) {
    items.push({
      id: "sync-failures",
      category: "critical",
      title: "Sync Failures",
      message: `${data.syncFailures} booking(s) failed to sync with Uplisting.`,
      href: "/admin/bookings",
      count: data.syncFailures,
    });
  }

  if (data.abandonedCheckouts > 0) {
    items.push({
      id: "abandoned-checkouts",
      category: "warning",
      title: "Abandoned Checkouts",
      message: `${data.abandonedCheckouts} abandoned checkout(s) may need follow-up reminders.`,
      href: "/admin/marketing",
      count: data.abandonedCheckouts,
    });
  }

  if (data.pendingReviews > 0) {
    items.push({
      id: "pending-reviews",
      category: "warning",
      title: "Pending Review Requests",
      message: `${data.pendingReviews} review request(s) are pending and have not been sent yet.`,
      href: "/admin/marketing",
      count: data.pendingReviews,
    });
  }

  if (data.todayCheckIns > 0) {
    items.push({
      id: "today-checkins",
      category: "info",
      title: "Today's Check-ins",
      message: `${data.todayCheckIns} guest(s) checking in today.`,
      href: "/admin/bookings",
      count: data.todayCheckIns,
    });
  }

  if (data.todayCheckOuts > 0) {
    items.push({
      id: "today-checkouts",
      category: "info",
      title: "Today's Check-outs",
      message: `${data.todayCheckOuts} guest(s) checking out today.`,
      href: "/admin/bookings",
      count: data.todayCheckOuts,
    });
  }

  return items;
}

export function NotificationsContent({
  initialData,
}: {
  initialData: NotificationData;
}) {
  const [data, setData] = useState<NotificationData>(initialData);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const fresh = await adminGet<NotificationData>(
        "/api/admin/notifications"
      );
      setData(fresh);
    } catch {
      // Keep current data on error
    } finally {
      setRefreshing(false);
    }
  }, []);

  const notifications = buildNotifications(data);

  const critical = notifications.filter((n) => n.category === "critical");
  const warning = notifications.filter((n) => n.category === "warning");
  const info = notifications.filter((n) => n.category === "info");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="mt-1 text-sm text-gray-500">
            System alerts and important updates
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50"
        >
          {refreshing ? (
            <LoadingSpinner size="sm" />
          ) : (
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182"
              />
            </svg>
          )}
          Refresh
        </button>
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-xl bg-white p-12 text-center shadow-sm border border-gray-100">
          <svg
            className="mx-auto h-12 w-12 text-gray-300"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
          </svg>
          <p className="mt-3 text-lg font-medium text-gray-900">
            All clear
          </p>
          <p className="mt-1 text-sm text-gray-500">
            No notifications at this time.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {critical.length > 0 && (
            <NotificationSection
              title="Critical"
              items={critical}
              category="critical"
            />
          )}
          {warning.length > 0 && (
            <NotificationSection
              title="Warnings"
              items={warning}
              category="warning"
            />
          )}
          {info.length > 0 && (
            <NotificationSection
              title="Information"
              items={info}
              category="info"
            />
          )}
        </div>
      )}
    </div>
  );
}

function NotificationSection({
  items,
  category,
}: {
  title: string;
  items: NotificationItem[];
  category: "critical" | "warning" | "info";
}) {
  const styles = categoryStyles[category];

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles.labelBg}`}
        >
          {styles.label}
        </span>
        <span className="text-sm text-gray-500">
          {items.length} notification{items.length !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className={`flex items-center gap-4 rounded-lg border-l-4 ${styles.border} ${styles.bg} p-4 transition-all hover:shadow-md`}
          >
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${styles.badge}`}
            >
              <span className="text-sm font-bold">{item.count}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">
                {item.title}
              </p>
              <p className="mt-0.5 text-sm text-gray-600">{item.message}</p>
            </div>
            <svg
              className="h-5 w-5 shrink-0 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m8.25 4.5 7.5 7.5-7.5 7.5"
              />
            </svg>
          </Link>
        ))}
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { Card } from "@/components/admin/ui/card";
import { Badge } from "@/components/admin/ui/badge";
import { Alert } from "@/components/admin/ui/alert";

interface Stats {
  totalBookings: number;
  confirmedBookings: number;
  pendingBookings: number;
  totalRevenue: number;
  monthRevenue: number;
  todayCheckIns: number;
  todayCheckOuts: number;
}

interface RecentBooking {
  id: string;
  guest_name: string;
  accommodation: string;
  check_in: string;
  check_out: string;
  status: string;
  total_price: number | null;
}

interface Notifications {
  failedPayments: number;
  syncFailures: number;
  pendingBookings: number;
  todayCheckIns: number;
  todayCheckOuts: number;
  recentMessages: number;
}

interface DashboardContentProps {
  stats: Stats;
  recentBookings: RecentBooking[];
  notifications: Notifications;
}

const statusVariant: Record<string, "success" | "warning" | "error" | "info" | "default"> = {
  confirmed: "success",
  completed: "success",
  pending: "warning",
  cancelled: "error",
};

const quickLinks = [
  { label: "New Booking", href: "/admin/bookings/new", description: "Create a manual booking" },
  { label: "Calendar", href: "/admin/calendar", description: "View availability calendar" },
  { label: "Reviews", href: "/admin/reviews", description: "Manage guest reviews" },
  { label: "Pricing", href: "/admin/pricing", description: "Update seasonal rates" },
  { label: "Promotions", href: "/admin/promotions", description: "Manage promo codes" },
  { label: "Analytics", href: "/admin/analytics", description: "View detailed reports" },
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatAccommodation(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function DashboardContent({
  stats,
  recentBookings,
  notifications,
}: DashboardContentProps) {
  const hasNotifications =
    notifications.failedPayments > 0 ||
    notifications.syncFailures > 0 ||
    notifications.pendingBookings > 0 ||
    notifications.recentMessages > 0;

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of your property management
        </p>
      </div>

      {/* Notification alerts */}
      {hasNotifications && (
        <div className="space-y-3">
          {notifications.failedPayments > 0 && (
            <Alert variant="error" title="Failed Payments">
              {notifications.failedPayments} booking(s) with failed payments require attention.
            </Alert>
          )}
          {notifications.syncFailures > 0 && (
            <Alert variant="warning" title="Sync Failures">
              {notifications.syncFailures} booking(s) failed to sync with Uplisting.
            </Alert>
          )}
          {notifications.recentMessages > 0 && (
            <Alert variant="info" title="New Messages">
              {notifications.recentMessages} new contact message(s) in the last 24 hours.
            </Alert>
          )}
        </div>
      )}

      {/* Stat cards grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card
          title="Total Bookings"
          value={stats.totalBookings}
          subtitle={`${stats.confirmedBookings} confirmed`}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
            </svg>
          }
        />
        <Card
          title="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          subtitle={`${formatCurrency(stats.monthRevenue)} this month`}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          }
        />
        <Card
          title="Today's Check-ins"
          value={stats.todayCheckIns}
          subtitle={`${stats.todayCheckOuts} check-out(s)`}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
            </svg>
          }
        />
        <Card
          title="Pending Bookings"
          value={stats.pendingBookings}
          subtitle="Awaiting confirmation"
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          }
        />
      </div>

      {/* Recent bookings table */}
      <div className="rounded-xl bg-white shadow-sm border border-gray-100">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Recent Bookings
          </h2>
          <Link
            href="/admin/bookings"
            className="text-sm font-medium text-[#2d5a5a] hover:text-[#234848]"
          >
            View all
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                <th className="px-6 py-3">Guest</th>
                <th className="px-6 py-3">Accommodation</th>
                <th className="px-6 py-3">Check-in</th>
                <th className="px-6 py-3">Check-out</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {recentBookings.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-sm text-gray-400"
                  >
                    No bookings yet
                  </td>
                </tr>
              ) : (
                recentBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50/50">
                    <td className="whitespace-nowrap px-6 py-3.5 text-sm font-medium text-gray-900">
                      {booking.guest_name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-3.5 text-sm text-gray-600">
                      {formatAccommodation(booking.accommodation)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-3.5 text-sm text-gray-600">
                      {formatDate(booking.check_in)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-3.5 text-sm text-gray-600">
                      {formatDate(booking.check_out)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-3.5">
                      <Badge variant={statusVariant[booking.status] ?? "default"}>
                        {booking.status}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-6 py-3.5 text-right text-sm text-gray-900">
                      {booking.total_price !== null
                        ? formatCurrency(booking.total_price)
                        : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick links */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Quick Links
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:border-[#2d5a5a]/20 hover:shadow-md"
            >
              <p className="text-sm font-semibold text-gray-900 group-hover:text-[#2d5a5a]">
                {link.label}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {link.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

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
  todayArrivalCount: number;
  todayDepartureCount: number;
  inHouseNow: number;
  sevenDayOccupancyPct: number;
  sevenDayBookedNights: number;
  sevenDayTotalNights: number;
}

interface UpcomingStay {
  id: string;
  guest_name: string;
  accommodation: string;
  check_in: string;
  check_out: string;
  status: string;
  total_price: number | null;
}

interface TodayArrival {
  id: string;
  guest_name: string;
  guest_phone: string | null;
  accommodation: string;
  guests: number | null;
}

interface TodayDeparture {
  id: string;
  guest_name: string;
  accommodation: string;
}

interface Notifications {
  failedPayments: number;
  syncFailures: number;
  pendingBookings: number;
  recentMessages: number;
  failedWebhooks: number;
  abandonedCheckouts: number;
  pendingReviews: number;
}

interface PropertyRevenue {
  id: string;
  label: string;
  current: number;
  previous: number;
  deltaPct: number | null;
}

interface DashboardContentProps {
  stats: Stats;
  upcomingStays: UpcomingStay[];
  todayArrivals: TodayArrival[];
  todayDepartures: TodayDeparture[];
  notifications: Notifications;
  propertyRevenue: PropertyRevenue[];
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
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
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
  upcomingStays,
  todayArrivals,
  todayDepartures,
  notifications,
  propertyRevenue,
}: DashboardContentProps) {
  const hasNotifications =
    notifications.failedPayments > 0 ||
    notifications.syncFailures > 0 ||
    notifications.pendingBookings > 0 ||
    notifications.recentMessages > 0 ||
    notifications.failedWebhooks > 0 ||
    notifications.abandonedCheckouts > 0 ||
    notifications.pendingReviews > 0;

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
          {notifications.failedWebhooks > 0 && (
            <Alert variant="error" title="Failed Webhooks">
              {notifications.failedWebhooks} Stripe webhook event(s) failed to
              process and have not been resolved. Investigate via the
              failed_webhook_events table.
            </Alert>
          )}
          {notifications.recentMessages > 0 && (
            <Alert variant="info" title="New Messages">
              {notifications.recentMessages} new contact message(s) in the last 24 hours.{" "}
              <Link href="/admin/messages" className="font-semibold underline">
                View messages →
              </Link>
            </Alert>
          )}
          {notifications.abandonedCheckouts > 0 && (
            <Alert variant="warning" title="Abandoned Checkouts">
              {notifications.abandonedCheckouts} abandoned checkout(s) may need
              follow-up reminders.
            </Alert>
          )}
          {notifications.pendingReviews > 0 && (
            <Alert variant="warning" title="Pending Review Requests">
              {notifications.pendingReviews} review request(s) are pending and
              have not been sent yet.
            </Alert>
          )}
        </div>
      )}

      {/* Stat cards grid — daily-operational focus */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card
          title="In-house Tonight"
          value={stats.inHouseNow}
          subtitle={`${stats.todayArrivalCount} arriving · ${stats.todayDepartureCount} departing`}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
          }
        />
        <Card
          title="Next 7 Days"
          value={`${stats.sevenDayOccupancyPct}%`}
          subtitle={`${stats.sevenDayBookedNights} of ${stats.sevenDayTotalNights} nights booked`}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
            </svg>
          }
        />
        <Card
          title="This Month's Revenue"
          value={formatCurrency(stats.monthRevenue)}
          subtitle={`${formatCurrency(stats.totalRevenue)} all-time`}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          }
        />
        <Card
          title="Confirmed Bookings"
          value={stats.confirmedBookings}
          subtitle={`${stats.totalBookings} total · ${stats.pendingBookings} pending`}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
            </svg>
          }
        />
      </div>

      {/* Today's arrivals + departures */}
      {(todayArrivals.length > 0 || todayDepartures.length > 0) && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl bg-white shadow-sm border border-gray-100">
            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Arriving Today
                {todayArrivals.length > 0 && (
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({todayArrivals.length})
                  </span>
                )}
              </h2>
            </div>
            <div className="divide-y divide-gray-50">
              {todayArrivals.length === 0 ? (
                <p className="px-6 py-6 text-center text-sm text-gray-400">
                  No arrivals today
                </p>
              ) : (
                todayArrivals.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between px-6 py-3"
                  >
                    <div>
                      <Link
                        href={`/admin/bookings/${a.id}`}
                        className="text-sm font-medium text-gray-900 hover:text-[#2d5a5a]"
                      >
                        {a.guest_name}
                      </Link>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {formatAccommodation(a.accommodation)}
                        {a.guests ? ` · ${a.guests} guest${a.guests === 1 ? "" : "s"}` : ""}
                      </p>
                    </div>
                    {a.guest_phone ? (
                      <a
                        href={`tel:${a.guest_phone}`}
                        className="text-sm font-medium text-[#2d5a5a] hover:underline"
                      >
                        {a.guest_phone}
                      </a>
                    ) : (
                      <span className="text-xs text-gray-400">No phone</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-xl bg-white shadow-sm border border-gray-100">
            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Departing Today
                {todayDepartures.length > 0 && (
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({todayDepartures.length})
                  </span>
                )}
              </h2>
            </div>
            <div className="divide-y divide-gray-50">
              {todayDepartures.length === 0 ? (
                <p className="px-6 py-6 text-center text-sm text-gray-400">
                  No departures today
                </p>
              ) : (
                todayDepartures.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between px-6 py-3"
                  >
                    <Link
                      href={`/admin/bookings/${d.id}`}
                      className="text-sm font-medium text-gray-900 hover:text-[#2d5a5a]"
                    >
                      {d.guest_name}
                    </Link>
                    <span className="text-xs text-gray-500">
                      {formatAccommodation(d.accommodation)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Per-property month-over-month revenue */}
      <div className="rounded-xl bg-white shadow-sm border border-gray-100">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Revenue by Property</h2>
          <span className="text-xs text-gray-400">vs previous month</span>
        </div>
        <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-3">
          {propertyRevenue.map((p) => {
            const up = p.deltaPct !== null && p.deltaPct >= 0;
            const deltaColor =
              p.deltaPct === null
                ? "text-gray-400"
                : up
                ? "text-green-600"
                : "text-red-600";
            return (
              <div key={p.id} className="rounded-lg border border-gray-100 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  {p.label}
                </p>
                <p className="mt-2 text-xl font-bold text-gray-900">
                  {formatCurrency(p.current)}
                </p>
                <p className={`mt-1 text-xs ${deltaColor}`}>
                  {p.deltaPct === null
                    ? "No prior month data"
                    : `${up ? "▲" : "▼"} ${Math.abs(p.deltaPct).toFixed(1)}% from ${formatCurrency(p.previous)}`}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming stays table */}
      <div className="rounded-xl bg-white shadow-sm border border-gray-100">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Upcoming Stays
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
              {upcomingStays.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-sm text-gray-400"
                  >
                    No upcoming stays
                  </td>
                </tr>
              ) : (
                upcomingStays.map((booking) => (
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

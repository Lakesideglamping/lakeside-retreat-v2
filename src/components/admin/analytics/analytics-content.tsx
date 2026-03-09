"use client";

import { useState, useEffect, useCallback } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { adminGet } from "@/lib/admin-api";
import { Card } from "@/components/admin/ui/card";
import { Tabs } from "@/components/admin/ui/tabs";
import { LoadingSpinner } from "@/components/admin/ui/loading-spinner";
import { Alert } from "@/components/admin/ui/alert";

interface AnalyticsData {
  summary: {
    totalRevenue: number;
    totalBookings: number;
    avgBookingValue: number;
    occupancyRate: number;
  };
  revenueTimeSeries: { date: string; revenue: number }[];
  byAccommodation: {
    accommodation: string;
    bookings: number;
    revenue: number;
  }[];
  bySource: { source: string; bookings: number; revenue: number }[];
}

const dateRangeTabs = [
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
  { key: "quarter", label: "Quarter" },
  { key: "year", label: "Year" },
];

const TEAL = "#2d5a5a";
const BURGUNDY = "#753742";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function AnalyticsContent() {
  const [dateRange, setDateRange] = useState("month");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await adminGet<AnalyticsData>(
        `/api/admin/analytics?dateRange=${dateRange}`
      );
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="error" title="Error">
        {error}
      </Alert>
    );
  }

  if (!data) return null;

  const { summary, revenueTimeSeries, byAccommodation, bySource } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="mt-1 text-sm text-gray-500">
          Revenue and booking performance overview
        </p>
      </div>

      {/* Date range selector */}
      <Tabs tabs={dateRangeTabs} activeTab={dateRange} onChange={setDateRange} />

      {/* Summary stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card
          title="Total Revenue"
          value={formatCurrency(summary.totalRevenue)}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          }
        />
        <Card
          title="Total Bookings"
          value={summary.totalBookings}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
            </svg>
          }
        />
        <Card
          title="Avg Booking Value"
          value={formatCurrency(summary.avgBookingValue)}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
            </svg>
          }
        />
        <Card
          title="Occupancy Rate"
          value={`${summary.occupancyRate}%`}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
          }
        />
      </div>

      {/* Revenue over time chart */}
      <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Revenue Over Time
        </h2>
        {revenueTimeSeries.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-400">
            No revenue data for this period
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={revenueTimeSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <YAxis
                tick={{ fontSize: 12 }}
                stroke="#9ca3af"
                tickFormatter={(v: number) => `$${v.toLocaleString()}`}
              />
              <Tooltip
                formatter={((value: number) => [formatCurrency(value), "Revenue"]) as never}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke={TEAL}
                strokeWidth={2}
                dot={{ fill: TEAL, r: 4 }}
                name="Revenue"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Bookings by accommodation */}
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Bookings by Accommodation
          </h2>
          {byAccommodation.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-400">
              No accommodation data
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={byAccommodation}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="accommodation"
                  tick={{ fontSize: 11 }}
                  stroke="#9ca3af"
                />
                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="bookings"
                  fill={TEAL}
                  name="Bookings"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="revenue"
                  fill={BURGUNDY}
                  name="Revenue ($)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Revenue by source */}
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Revenue by Source
          </h2>
          {bySource.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-400">
              No source data
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={bySource} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 12 }}
                  stroke="#9ca3af"
                  tickFormatter={(v: number) => `$${v.toLocaleString()}`}
                />
                <YAxis
                  type="category"
                  dataKey="source"
                  tick={{ fontSize: 12 }}
                  stroke="#9ca3af"
                  width={100}
                />
                <Tooltip
                  formatter={((value: number, name: string) => [
                    name === "Revenue ($)" ? formatCurrency(value) : value,
                    name,
                  ]) as never}
                />
                <Legend />
                <Bar
                  dataKey="revenue"
                  fill={TEAL}
                  name="Revenue ($)"
                  radius={[0, 4, 4, 0]}
                />
                <Bar
                  dataKey="bookings"
                  fill={BURGUNDY}
                  name="Bookings"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useCallback } from "react";
import { adminGet } from "@/lib/admin-api";
import { LoadingSpinner } from "@/components/admin/ui/loading-spinner";

interface ContactMessage {
  id: number;
  name: string;
  email: string;
  message: string;
  created_at: string | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface MessagesData {
  messages: ContactMessage[];
  pagination: Pagination;
}

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-NZ", {
    timeZone: "Pacific/Auckland",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ContactMessagesContent({
  initialData,
}: {
  initialData: MessagesData;
}) {
  const [data, setData] = useState<MessagesData>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { messages, pagination } = data;

  const loadPage = useCallback(async (page: number) => {
    setLoading(true);
    setError(null);
    try {
      const fresh = await adminGet<MessagesData>(
        `/api/admin/contact-messages?page=${page}&limit=20`
      );
      setData(fresh);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <p className="mt-1 text-sm text-gray-500">
            Contact-form enquiries from the website. Also forwarded to your
            inbox — this is the searchable record.
          </p>
        </div>
        <button
          onClick={() => loadPage(pagination.page)}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50"
        >
          {loading ? <LoadingSpinner size="sm" /> : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border-l-4 border-red-500 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {messages.length === 0 ? (
        <div className="rounded-xl border border-gray-100 bg-white p-12 text-center shadow-sm">
          <p className="text-lg font-medium text-gray-900">No messages yet</p>
          <p className="mt-1 text-sm text-gray-500">
            Enquiries sent through the website contact form will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((m) => (
            <div
              key={m.id}
              className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-gray-900">{m.name}</p>
                  <a
                    href={`mailto:${m.email}?subject=Re: your Lakeside Retreat enquiry`}
                    className="text-sm text-burgundy hover:underline"
                  >
                    {m.email}
                  </a>
                </div>
                <span className="text-xs text-gray-400">
                  {formatDateTime(m.created_at)}
                </span>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                {m.message}
              </p>
              <div className="mt-3">
                <a
                  href={`mailto:${m.email}?subject=Re: your Lakeside Retreat enquiry`}
                  className="inline-flex items-center gap-1 text-sm font-medium text-burgundy hover:underline"
                >
                  Reply by email &rarr;
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-100 pt-4">
          <span className="text-sm text-gray-500">
            Page {pagination.page} of {pagination.totalPages} · {pagination.total}{" "}
            total
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => loadPage(pagination.page - 1)}
              disabled={loading || pagination.page <= 1}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => loadPage(pagination.page + 1)}
              disabled={loading || pagination.page >= pagination.totalPages}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

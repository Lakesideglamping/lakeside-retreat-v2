"use client";

import { useState } from "react";

interface Column<T> {
  key: string;
  header: string;
  render?: (value: unknown, row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  pagination?: {
    page: number;
    totalPages: number;
    onPageChange: (p: number) => void;
  };
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, part) => {
    if (acc && typeof acc === "object" && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  loading = false,
  pagination,
  onRowClick,
  emptyMessage = "No data available",
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sortedData = sortKey
    ? [...data].sort((a, b) => {
        const aVal = getNestedValue(a, sortKey);
        const bVal = getNestedValue(b, sortKey);
        if (aVal == null || bVal == null) return 0;
        const cmp = String(aVal).localeCompare(String(bVal), undefined, {
          numeric: true,
        });
        return sortDir === "asc" ? cmp : -cmp;
      })
    : data;

  if (loading) {
    return (
      <div className="w-full overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 ${col.className ?? ""}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-gray-100">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3">
                    <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (sortedData.length === 0) {
    return (
      <div className="w-full overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 ${col.className ?? ""}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
        </table>
        <div className="flex items-center justify-center py-12 text-gray-400">
          {emptyMessage}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-xl border border-gray-200 bg-white">
      {/* Mobile: stacked cards. On phone, a horizontally-scrolling table is
          unusable — each row becomes a label:value card instead. */}
      <div className="md:hidden divide-y divide-gray-100">
        {sortedData.map((row, i) => (
          <div
            key={`m-${i}`}
            className={`p-4 ${onRowClick ? "cursor-pointer active:bg-gray-50" : ""}`}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
          >
            <dl className="space-y-2">
              {columns.map((col) => {
                const cellValue = getNestedValue(row, col.key);
                const rendered = col.render
                  ? col.render(cellValue, row)
                  : String(cellValue ?? "");
                return (
                  <div key={col.key} className="flex items-start justify-between gap-3">
                    <dt className="shrink-0 text-xs font-medium uppercase tracking-wide text-gray-400">
                      {col.header}
                    </dt>
                    <dd className="text-right text-sm text-gray-800 break-words">
                      {rendered}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </div>
        ))}
      </div>

      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 ${
                    col.sortable ? "cursor-pointer select-none hover:text-gray-700" : ""
                  } ${col.className ?? ""}`}
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {col.sortable && sortKey === col.key && (
                      <svg
                        className="h-3 w-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d={
                            sortDir === "asc"
                              ? "M4.5 15.75l7.5-7.5 7.5 7.5"
                              : "M19.5 8.25l-7.5 7.5-7.5-7.5"
                          }
                        />
                      </svg>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((row, i) => (
              <tr
                key={i}
                className={`border-b border-gray-100 transition-colors ${
                  i % 2 === 1 ? "bg-gray-50/50" : ""
                } ${onRowClick ? "cursor-pointer hover:bg-gray-100" : ""}`}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((col) => {
                  const cellValue = getNestedValue(row, col.key);
                  return (
                    <td
                      key={col.key}
                      className={`px-4 py-3 text-sm text-gray-700 ${col.className ?? ""}`}
                    >
                      {col.render ? col.render(cellValue, row) : String(cellValue ?? "")}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
          <span className="text-sm text-gray-500">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

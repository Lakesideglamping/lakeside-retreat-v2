"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { adminPost, resetCsrfToken } from "@/lib/admin-api";

interface AdminTopBarProps {
  username: string;
}

function getTitleFromPathname(pathname: string): string {
  if (pathname === "/admin") return "Dashboard";

  const segment = pathname.replace("/admin/", "").split("/")[0];
  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function AdminTopBar({ username }: AdminTopBarProps) {
  const pathname = usePathname();
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const title = getTitleFromPathname(pathname);

  async function handleLogout() {
    setLoggingOut(true);
    setError(null);
    try {
      await adminPost("/api/admin/logout");
      resetCsrfToken();
      // Use window.location.href (not router.push) so AdminShell fully
      // unmounts and the login page renders without cached admin state.
      window.location.href = "/admin/login";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Logout failed");
      setLoggingOut(false);
    }
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6">
      {/* Page title — offset on mobile to account for hamburger */}
      <h1 className="font-display text-xl font-semibold text-gray-900 pl-10 lg:pl-0">
        {title}
      </h1>

      <div className="flex items-center gap-4">
        {error && (
          <span className="text-xs text-red-600" role="alert">
            {error}
          </span>
        )}

        {/* Notification bell placeholder */}
        <button
          type="button"
          className="relative rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          aria-label="Notifications"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
          </svg>
        </button>

        {/* Username */}
        <span className="hidden text-sm font-medium text-gray-600 sm:inline-block">
          {username}
        </span>

        {/* Logout button */}
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors disabled:opacity-50"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
          </svg>
          <span className="hidden sm:inline-block">
            {loggingOut ? "Signing out..." : "Logout"}
          </span>
        </button>
      </div>
    </header>
  );
}

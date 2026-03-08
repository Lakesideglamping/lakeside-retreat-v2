"use client";

import { AdminSidebar } from "./admin-sidebar";
import { AdminTopBar } from "./admin-top-bar";

interface AdminShellProps {
  username: string;
  children: React.ReactNode;
}

export function AdminShell({ username, children }: AdminShellProps) {
  return (
    <div className="flex h-screen bg-admin-bg">
      <AdminSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminTopBar username={username} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}

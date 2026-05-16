import type { Metadata } from "next";
import { headers } from "next/headers";
import { AdminShell } from "@/components/admin/admin-shell";

export const metadata: Metadata = {
  title: {
    default: "Admin | Lakeside Retreat",
    template: "%s - Admin | Lakeside Retreat",
  },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerStore = await headers();
  const pathname = headerStore.get("x-pathname") ?? "";

  const isLoginPage = pathname === "/admin/login" || pathname.startsWith("/admin/login");

  // On the login page, render children without the admin shell
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Username is forwarded by middleware (x-admin-username) after the JWT
  // signature check there. Avoids a per-page-load DB round trip just to
  // populate the header greeting — actual auth enforcement happens in
  // middleware (signature) and withAdmin() on API routes (blacklist).
  const username = headerStore.get("x-admin-username") || "Admin";

  return <AdminShell username={username}>{children}</AdminShell>;
}

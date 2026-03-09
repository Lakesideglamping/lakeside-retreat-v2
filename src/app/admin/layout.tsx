import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
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

  // For all other admin pages, verify the token and render with the shell.
  // The middleware already enforces auth, so this is a secondary check
  // that also extracts the username for display.
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  let username = "Admin";
  if (token) {
    try {
      const payload = await verifyToken(token);
      if (payload?.username) {
        username = payload.username;
      }
    } catch {
      // Token verification failed — still render shell with default username
    }
  }

  return <AdminShell username={username}>{children}</AdminShell>;
}

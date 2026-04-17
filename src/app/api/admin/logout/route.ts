import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { blacklistToken, verifyToken, COOKIE_NAME } from "@/lib/auth";
import { isValidCsrfToken } from "@/lib/csrf";
import { auditLog } from "@/lib/audit";

// Logout is intentionally NOT wrapped in `withAdminMutation` — we still want to
// clear the cookie even if the JWT has already expired. But we do require a
// valid CSRF token so a malicious site can't force-logout an admin via CSRF.
export async function POST(request: Request) {
  const csrfToken = request.headers.get("x-csrf-token");
  if (!csrfToken || !isValidCsrfToken(csrfToken)) {
    return NextResponse.json(
      { error: "Invalid CSRF token" },
      { status: 403 }
    );
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (token) {
    // Try to identify who is logging out for the audit log.
    const admin = await verifyToken(token).catch(() => null);
    await blacklistToken(token);
    if (admin) {
      const ip =
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        request.headers.get("x-real-ip") ??
        "unknown";
      await auditLog(admin.username, "logout", {}, ip);
    }
  }

  const response = NextResponse.json({ success: true });
  response.cookies.delete(COOKIE_NAME);
  return response;
}

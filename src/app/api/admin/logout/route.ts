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

  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  // Verify the JWT first so we know whose CSRF token to validate against.
  // If the cookie is missing/invalid we still clear the cookie below — but
  // we refuse to act on the blacklist/audit without a valid session, since
  // CSRF binding requires a known username.
  const admin = token ? await verifyToken(token).catch(() => null) : null;

  if (!csrfToken || !admin || !isValidCsrfToken(csrfToken, admin.username)) {
    return NextResponse.json(
      { error: "Invalid CSRF token" },
      { status: 403 }
    );
  }

  if (token) {
    try {
      await blacklistToken(token);
    } catch {
      // blacklistToken logs the underlying error. Surface a 500 so the
      // client knows the token may still be valid server-side — but still
      // clear the local cookie so the browser session is ended.
      const response = NextResponse.json(
        { error: "Logout partially failed. Please clear your cookies." },
        { status: 500 }
      );
      response.cookies.delete(COOKIE_NAME);
      return response;
    }
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";
    await auditLog(admin.username, "logout", {}, ip);
  }

  const response = NextResponse.json({ success: true });
  response.cookies.delete(COOKIE_NAME);
  return response;
}

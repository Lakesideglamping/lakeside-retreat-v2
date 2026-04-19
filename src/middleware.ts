import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const MAINTENANCE_MODE = process.env.MAINTENANCE_MODE === "true";
const IS_PROD = process.env.NODE_ENV === "production";

/**
 * Build a per-request CSP header with a unique script nonce. Modern
 * (CSP3) browsers see 'strict-dynamic' and ignore 'unsafe-inline',
 * so only Next's nonce-tagged bootstrap can run; older browsers fall
 * back to 'unsafe-inline'. Dev keeps 'unsafe-eval' for React Fast
 * Refresh. The static CSP in next.config.ts is superseded when this
 * header is present on the response.
 */
function buildCspHeader(nonce: string): string {
  const scriptSrc = IS_PROD
    ? `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-inline' https://js.stripe.com`
    : `script-src 'self' 'nonce-${nonce}' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com`;

  return [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' https://api.stripe.com https://*.stripe.com https://*.sentry.io https://*.ingest.sentry.io https://*.ingest.de.sentry.io https://*.ingest.us.sentry.io",
    "frame-src https://js.stripe.com https://hooks.stripe.com https://checkout.stripe.com",
    "form-action 'self' https://checkout.stripe.com",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "upgrade-insecure-requests",
  ].join("; ");
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Forward pathname to server components via custom header
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  // Generate a per-request CSP nonce and forward it to layouts/pages via
  // x-nonce. This lets the root layout apply the nonce to its inline
  // service-worker registration script.
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  requestHeaders.set("x-nonce", nonce);

  // Redirect all public routes to maintenance page
  if (
    MAINTENANCE_MODE &&
    !pathname.startsWith("/admin") &&
    !pathname.startsWith("/api") &&
    pathname !== "/maintenance"
  ) {
    return NextResponse.redirect(new URL("/maintenance", request.url));
  }

  // Only protect /admin/* except /admin/login and /api/admin/login.
  //
  // Auth enforcement is split across two layers intentionally:
  //
  //   1. Middleware (here): fast JWT signature + expiry check. Redirects
  //      unauthenticated visitors before any page work happens. Does NOT
  //      check the token blacklist — the Edge runtime cannot safely reach
  //      Postgres on every request.
  //
  //   2. Admin layout + withAdmin() (lib/admin-route.ts): full verifyToken()
  //      which includes the blacklist lookup. This is the authoritative
  //      enforcement point. All server-rendered admin pages go through the
  //      layout; all admin API routes go through withAdmin/withAdminMutation.
  //
  // A blacklisted (logged-out) token therefore passes this middleware check
  // but is blocked by the layout/API layer before any data is served.
  // Never add admin routes that bypass the layout without an explicit
  // withAdmin() call.
  if (
    pathname.startsWith("/admin") &&
    pathname !== "/admin/login" &&
    !pathname.startsWith("/api/admin/login")
  ) {
    const token = request.cookies.get("auth-token")?.value;

    if (!token) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      await jwtVerify(token, secret, {
        issuer: "lakeside-retreat",
        audience: "admin-panel",
      });
      const response = NextResponse.next({
        request: { headers: requestHeaders },
      });
      response.headers.set("Content-Security-Policy", buildCspHeader(nonce));
      return response;
    } catch {
      // Invalid or expired token
      const response = NextResponse.redirect(
        new URL("/admin/login", request.url)
      );
      response.cookies.delete("auth-token");
      return response;
    }
  }

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set("Content-Security-Policy", buildCspHeader(nonce));
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images/|sw\\.js|manifest\\.json).*)"],
};

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const MAINTENANCE_MODE = false;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Forward pathname to server components via custom header
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  // Redirect all public routes to maintenance page
  if (
    MAINTENANCE_MODE &&
    !pathname.startsWith("/admin") &&
    !pathname.startsWith("/api") &&
    pathname !== "/maintenance"
  ) {
    return NextResponse.redirect(new URL("/maintenance", request.url));
  }

  // Only protect /admin/* except /admin/login and /api/admin/login
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
      return NextResponse.next({
        request: { headers: requestHeaders },
      });
    } catch {
      // Invalid or expired token
      const response = NextResponse.redirect(
        new URL("/admin/login", request.url)
      );
      response.cookies.delete("auth-token");
      return response;
    }
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images/).*)"],
};

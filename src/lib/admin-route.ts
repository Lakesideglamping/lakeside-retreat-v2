import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, COOKIE_NAME, type AdminPayload } from "./auth";
import { isValidCsrfToken } from "./csrf";

type RouteHandler = (
  admin: AdminPayload,
  request: Request
) => Promise<Response>;

export async function withAdmin(
  request: Request,
  handler: RouteHandler
): Promise<Response> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = await verifyToken(token);
    if (!admin) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    return handler(admin, request);
  } catch (error) {
    console.error("Admin route error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function withAdminMutation(
  request: Request,
  handler: RouteHandler
): Promise<Response> {
  return withAdmin(request, async (admin, req) => {
    // Validate CSRF token for mutations
    const csrfToken = req.headers.get("x-csrf-token");
    if (!csrfToken || !isValidCsrfToken(csrfToken, admin.username)) {
      return NextResponse.json(
        { error: "Invalid CSRF token" },
        { status: 403 }
      );
    }
    return handler(admin, req);
  });
}

export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

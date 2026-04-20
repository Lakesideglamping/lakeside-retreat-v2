import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, COOKIE_NAME, type AdminPayload } from "./auth";
import { isValidCsrfToken } from "./csrf";
import { checkRateLimit } from "./rate-limit";
import { logger } from "./logger";

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
    logger.error("Admin route error", { err: error });
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

    // Blanket mutation rate limit: 60 requests per minute per admin.
    // Protects all mutation routes against a compromised or runaway session
    // without needing per-route wiring. Financial routes (deposit claim,
    // refund, import) add a tighter second limit on top of this one.
    const mutationLimit = await checkRateLimit(
      `admin_mutation:${admin.username}`,
      60 * 1000,
      60
    );
    if (!mutationLimit.success) {
      logger.warn("admin mutation rate limit exceeded", {
        username: admin.username,
      });
      return NextResponse.json(
        { error: "Too many requests — slow down and try again" },
        { status: 429 }
      );
    }

    return handler(admin, req);
  });
}

// Extract the real client IP. Prefer x-real-ip (set by Render's load balancer
// directly from the TCP connection — cannot be spoofed by the client) over
// x-forwarded-for (which clients can prepend fake entries to). On Render,
// x-forwarded-for[0] is also the real IP because Render prepends it, but
// x-real-ip is unambiguous.
export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-real-ip")?.trim() ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

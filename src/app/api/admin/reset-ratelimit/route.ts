import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { clearRateLimit } from "@/lib/rate-limit";
import { clearAllFailedAttempts } from "@/lib/login-attempts";

/**
 * Emergency rate-limit + lockout reset.
 *
 * Requires RESET_TOKEN env var. Token is read from the `x-reset-token`
 * request header (POST only) — never from a URL, because URLs leak to
 * access logs, browser history, and Referer headers.
 *
 *   curl -X POST https://.../api/admin/reset-ratelimit \
 *        -H "x-reset-token: $RESET_TOKEN"
 */

export async function POST(request: Request) {
  const expected = process.env.RESET_TOKEN;
  if (!expected) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const token = request.headers.get("x-reset-token") ?? "";

  // Constant-time compare; short-circuit on length to avoid a throw from
  // timingSafeEqual when buffers don't match length.
  const tokenBuf = Buffer.from(token);
  const expectedBuf = Buffer.from(expected);
  const valid =
    tokenBuf.length === expectedBuf.length &&
    timingSafeEqual(tokenBuf, expectedBuf);

  if (!valid) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await clearRateLimit("login:");
  await clearAllFailedAttempts();

  return NextResponse.json({
    success: true,
    message: "Rate limit cleared. You can now log in at /admin/login",
  });
}

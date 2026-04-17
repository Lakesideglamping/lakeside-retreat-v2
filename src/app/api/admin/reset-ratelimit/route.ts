import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { clearRateLimit } from "@/lib/rate-limit";
import { clearAllFailedAttempts } from "@/lib/login-attempts";

// Emergency rate-limit reset. Requires RESET_TOKEN env var.
// GET /api/admin/reset-ratelimit?token=YOUR_RESET_TOKEN

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const expected = process.env.RESET_TOKEN;

  if (!expected) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const tokenBuf = Buffer.from(token);
  const expectedBuf = Buffer.from(expected);
  const valid =
    tokenBuf.length === expectedBuf.length &&
    timingSafeEqual(tokenBuf, expectedBuf);

  if (!valid) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await clearRateLimit("login:");
  clearAllFailedAttempts();

  return NextResponse.json({
    success: true,
    message: "Rate limit cleared. You can now log in at /admin/login",
  });
}

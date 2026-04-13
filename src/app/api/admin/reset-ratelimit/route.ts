import { NextResponse } from "next/server";
import { clearRateLimit } from "@/lib/rate-limit";
import { clearAllFailedAttempts } from "@/lib/login-attempts";

// Emergency rate-limit reset. Requires RESET_TOKEN env var.
// GET /api/admin/reset-ratelimit?token=YOUR_RESET_TOKEN

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  const expected = process.env.RESET_TOKEN;

  if (!expected || token !== expected) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  clearRateLimit("login:");
  clearAllFailedAttempts();

  return NextResponse.json({
    success: true,
    message: "Rate limit cleared. You can now log in at /admin/login",
  });
}

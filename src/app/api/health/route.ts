import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Liveness — and deliberately nothing more.
 *
 * This endpoint answers one question: can this process still serve a request?
 * It makes no database query and no outbound call, so no third party can make
 * it fail.
 *
 * It used to return 503 whenever Stripe or Uplisting was unreachable, or even
 * just slower than three seconds. That is a hair trigger wired to a demolition
 * charge: Render treats a failing health check as a reason to restart or
 * de-rotate the instance, so a slow response from someone else's API took this
 * entire website off the air — and took the warm image cache with it, which on
 * a 512MB instance is its own outage (see next.config.ts).
 *
 * The rule this now follows: a health check should fail only when a restart
 * would actually help. A wedged process cannot answer this route at all, so
 * Render still detects that and still restarts — which is the one case where
 * restarting is the cure. Uplisting being down is not.
 *
 * Dependency status lives at /api/health/detail, which always returns 200 and
 * reports what it found in the body. Point alerting there, matching on
 * "status":"ok", so a third-party outage pages you instead of unpublishing you.
 */
export async function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
}

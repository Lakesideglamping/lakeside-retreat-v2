import { NextResponse } from "next/server";
import { checkHealth } from "@/lib/health";

export const dynamic = "force-dynamic";

/**
 * Dependency diagnostics: database, Stripe, email config, Uplisting.
 *
 * Always 200, even when something is broken. The status code says "this
 * service answered you"; the body says what it found. Those are different
 * questions and conflating them is what let a slow third-party API take the
 * site down — see the note in ../route.ts.
 *
 * Alerting should watch the body, not the code: UptimeRobot on this URL with a
 * keyword match for "status":"ok" alerts on a real dependency failure without
 * asking Render to restart anything.
 *
 * Kept public, like the old endpoint, so external monitors can reach it without
 * credentials. It discloses only which integrations exist — no keys, no
 * addresses, no counts — which is the same surface a look at the booking page
 * already gives away.
 */
export async function GET() {
  const health = await checkHealth();
  return NextResponse.json(health);
}

import { NextResponse } from "next/server";
import { generateCsrfToken } from "@/lib/csrf";
import { withAdmin, getClientIp } from "@/lib/admin-route";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(request: Request) {
  return withAdmin(request, async (_admin, req) => {
    // Rate-limit token issuance so a compromised session can't farm tokens.
    const rate = await checkRateLimit(
      `csrf-token:${getClientIp(req)}`,
      60 * 1000,
      30
    );
    if (!rate.success) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429 }
      );
    }
    const token = generateCsrfToken();
    return NextResponse.json({ token });
  });
}

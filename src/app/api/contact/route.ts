import { NextResponse } from "next/server";
import { contactFormSchema } from "@/lib/validations";
import { sendContactEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

const ALLOWED_ORIGIN = process.env.NEXT_PUBLIC_BASE_URL || "https://lakesideretreat.co.nz";

/**
 * Verify the request originates from our own site by checking the Origin
 * (set on same-site fetch) or Referer (older browsers) header.
 *
 * This prevents cross-site form submission without requiring a token
 * round-trip — appropriate for a stateless public endpoint where there
 * is no user session to bind a CSRF token to.
 *
 * Requests with no Origin/Referer (e.g. curl, server-side integrations)
 * are rejected in production only; relaxed in dev so tests pass.
 */
function isSameOrigin(request: Request): boolean {
  if (process.env.NODE_ENV !== "production") return true;
  const origin = request.headers.get("origin");
  if (origin) return origin === ALLOWED_ORIGIN;
  const referer = request.headers.get("referer");
  if (referer) return referer.startsWith(ALLOWED_ORIGIN);
  // No origin or referer — reject in production.
  return false;
}

export async function POST(request: Request) {
  try {
    if (!isSameOrigin(request)) {
      logger.warn("[api/contact] rejected cross-origin request", {
        origin: request.headers.get("origin"),
        referer: request.headers.get("referer"),
      });
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";

    const { success } = await checkRateLimit(
      `contact:${ip}`,
      10 * 60 * 1000,
      3
    );
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const result = contactFormSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await sendContactEmail(result.data);

    return NextResponse.json({
      success: true,
      message: "Thank you for your message. We'll be in touch soon.",
    });
  } catch (err) {
    logger.error("[api/contact] Error", { err });
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

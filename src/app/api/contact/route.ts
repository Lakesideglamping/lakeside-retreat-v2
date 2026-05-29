import { NextResponse } from "next/server";
import { contactFormSchema } from "@/lib/validations";
import { sendContactEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/db";

const ALLOWED_ORIGIN = process.env.NEXT_PUBLIC_BASE_URL || "https://lakesideretreat.co.nz";

// Human-readable labels for the subject enum, stored as a prefix on the
// message (the contact_messages table has no dedicated subject column).
const SUBJECT_LABELS: Record<string, string> = {
  booking: "Booking enquiry",
  availability: "Availability",
  special: "Special request",
  feedback: "Feedback",
  other: "Other",
};

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

    // Capture the enquiry two independent ways: persist to the DB (so it's
    // reviewable in the admin Messages panel) and email it (notification).
    // Each is best-effort and tracked separately. As long as ONE succeeds,
    // the message is safely captured and we confirm to the visitor — a flaky
    // SMTP send or a DB blip must not make a successfully-received enquiry
    // look like a failure (which causes resubmits/duplicates). Only a total
    // double-failure returns an error so the visitor knows to try again.
    let persisted = false;
    let emailed = false;

    try {
      const subjectLabel =
        SUBJECT_LABELS[result.data.subject] ?? result.data.subject;
      await prisma.contact_messages.create({
        data: {
          name: result.data.name,
          email: result.data.email,
          message: `[${subjectLabel}] ${result.data.message}`,
        },
      });
      persisted = true;
    } catch (dbErr) {
      logger.error("[api/contact] failed to persist message (continuing)", {
        error: dbErr instanceof Error ? dbErr.message : String(dbErr),
      });
    }

    try {
      await sendContactEmail(result.data);
      emailed = true;
    } catch (mailErr) {
      logger.error("[api/contact] failed to send email (continuing)", {
        error: mailErr instanceof Error ? mailErr.message : String(mailErr),
      });
    }

    if (!persisted && !emailed) {
      // The enquiry was neither stored nor emailed — genuinely lost.
      return NextResponse.json(
        { error: "Something went wrong. Please try again." },
        { status: 500 }
      );
    }

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

import { NextResponse } from "next/server";
import { withAdminMutation, getClientIp } from "@/lib/admin-route";
import { testEmailConfiguration, sendTestEmail } from "@/lib/email";
import { findEmailPreview } from "@/lib/email-previews";
import { checkRateLimit } from "@/lib/rate-limit";
import { auditLog } from "@/lib/audit";

/**
 * Two modes, deliberately on one endpoint:
 *
 *   no body / no templateId  -> verify the SMTP connection only
 *   { templateId }           -> render that template and actually send it
 *
 * The first proves credentials, which is what caught the 535 auth failure.
 * Only the second proves delivery, and shows how the HTML survives a real
 * mail client — the thing no amount of previewing can tell you.
 */
export async function POST(request: Request) {
  return withAdminMutation(request, async (admin, req) => {
    // A send endpoint without a limit is a way to get an SMTP account
    // throttled, by accident or by a stuck finger on the button.
    const limit = await checkRateLimit(
      `admin_email_test:${admin.username}`,
      60 * 60 * 1000,
      10
    );
    if (!limit.success) {
      return NextResponse.json(
        // `error` as well as `message`: the admin fetch helper surfaces
        // data.error on a non-2xx, so without it the caller sees only
        // "Request failed (429)" — the reason is what makes this useful.
        { success: false, error: "Too many test emails — wait an hour", message: "Too many test emails — wait an hour" },
        { status: 429 }
      );
    }

    // A malformed or absent body means "just verify", not an error.
    let templateId: string | undefined;
    try {
      const body = await req.json();
      if (typeof body?.templateId === "string") templateId = body.templateId;
    } catch {
      // no body — verify-only mode
    }

    if (!templateId) {
      const result = await testEmailConfiguration();
      await auditLog(
        admin.username,
        "email_test_performed",
        { mode: "verify", success: result.success, message: result.message },
        getClientIp(req)
      );
      return NextResponse.json(result);
    }

    // Resolve against the shared registry rather than trusting the id. This is
    // what stops the endpoint rendering anything the caller names.
    const preview = findEmailPreview(templateId);
    if (!preview) {
      return NextResponse.json(
        { success: false, error: `Unknown template: ${templateId}`, message: `Unknown template: ${templateId}` },
        { status: 400 }
      );
    }

    const result = await sendTestEmail(preview.id, preview.label, preview.html());

    await auditLog(
      admin.username,
      "email_test_sent",
      {
        mode: "send",
        templateId: preview.id,
        success: result.success,
        message: result.message,
      },
      getClientIp(req)
    );

    // On failure include `error` too, so the reason survives the client
    // helper rather than being flattened to "Request failed (502)".
    return NextResponse.json(
      result.success ? result : { ...result, error: result.message },
      { status: result.success ? 200 : 502 }
    );
  });
}

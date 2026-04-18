import { NextResponse } from "next/server";
import { withAdminMutation } from "@/lib/admin-route";
import { verifyTotp, saveTotpSecret } from "@/lib/totp";
import { auditLog } from "@/lib/audit";
import { getClientIp } from "@/lib/admin-route";
import { z } from "zod";

const schema = z.object({
  secret: z.string().min(16),
  token: z.string().length(6).regex(/^\d{6}$/),
});

export async function POST(request: Request) {
  return withAdminMutation(request, async (admin, req) => {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { secret, token } = parsed.data;

    if (!verifyTotp(secret, token)) {
      return NextResponse.json(
        { error: "Invalid verification code. Please try again." },
        { status: 400 }
      );
    }

    await saveTotpSecret(secret);
    await auditLog(admin.username, "2fa_enabled", {}, getClientIp(req));

    return NextResponse.json({ success: true });
  });
}

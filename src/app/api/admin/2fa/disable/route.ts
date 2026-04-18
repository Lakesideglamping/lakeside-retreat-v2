import { NextResponse } from "next/server";
import { withAdminMutation, getClientIp } from "@/lib/admin-route";
import { verifyTotp, getTotpSecret, deleteTotpSecret } from "@/lib/totp";
import { auditLog } from "@/lib/audit";
import { z } from "zod";

const schema = z.object({
  token: z.string().length(6).regex(/^\d{6}$/),
});

export async function POST(request: Request) {
  return withAdminMutation(request, async (admin, req) => {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const secret = await getTotpSecret();
    if (!secret) {
      return NextResponse.json({ error: "2FA is not enabled" }, { status: 400 });
    }

    if (!verifyTotp(secret, parsed.data.token)) {
      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 400 }
      );
    }

    await deleteTotpSecret();
    await auditLog(admin.username, "2fa_disabled", {}, getClientIp(req));

    return NextResponse.json({ success: true });
  });
}

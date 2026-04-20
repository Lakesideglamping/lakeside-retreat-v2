import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/admin-route";
import { getTotpSecret } from "@/lib/totp";

export async function GET(request: Request) {
  return withAdmin(request, async () => {
    // Ground truth for "is 2FA on" is the presence of a stored TOTP secret —
    // that's what the login gate checks (see login/route.ts). A prior version
    // read an `admin_2fa_enabled` flag that was never written, so the UI
    // always reported "Disabled" and admins could re-enroll over an existing
    // secret, breaking paired authenticator apps.
    const secret = await getTotpSecret();
    return NextResponse.json({ enabled: !!secret });
  });
}

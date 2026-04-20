import { NextResponse } from "next/server";
import { withAdminMutation, getClientIp } from "@/lib/admin-route";
import { getTotpSecret, generateRecoveryCodes, saveRecoveryCodes } from "@/lib/totp";
import { auditLog } from "@/lib/audit";

// Regenerate the operator's 2FA recovery code set. Old hashes are replaced
// wholesale — any previously-printed codes stop working immediately, which is
// the whole point of regeneration (e.g. the printout was lost or leaked).
export async function POST(request: Request) {
  return withAdminMutation(request, async (admin, req) => {
    const secret = await getTotpSecret();
    if (!secret) {
      return NextResponse.json(
        { error: "2FA is not enabled; enable it first to generate recovery codes." },
        { status: 400 }
      );
    }

    const recoveryCodes = generateRecoveryCodes();
    await saveRecoveryCodes(recoveryCodes);
    await auditLog(admin.username, "2fa_recovery_regenerated", {}, getClientIp(req));

    return NextResponse.json({ recoveryCodes });
  });
}

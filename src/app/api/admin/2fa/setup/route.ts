import { NextResponse } from "next/server";
import { withAdminMutation } from "@/lib/admin-route";
import { generateTotpSecret, generateQrCode } from "@/lib/totp";

// Generates a new TOTP secret + QR code but does NOT save it yet.
// The client holds the secret temporarily and sends it back with a
// verification code. The secret is only persisted once verified.
export async function POST(request: Request) {
  return withAdminMutation(request, async () => {
    const secret = generateTotpSecret();
    const qrCodeDataUrl = await generateQrCode(secret);

    return NextResponse.json({ secret, qrCodeDataUrl });
  });
}

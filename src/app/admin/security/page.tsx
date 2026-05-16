import { SecurityContent } from "@/components/admin/security/security-content";
import { getTotpSecret, getRecoveryCodeCount } from "@/lib/totp";

export default async function SecurityPage() {
  // Pre-fetch 2FA status on the server so the Enabled/Disabled badge is
  // correct on first paint — matches the pattern used by Pricing,
  // Notifications, and the Dashboard. Without this the page chrome shows
  // for ~1.7s with a stale "Disabled" badge before the client fetch
  // resolves.
  const secret = await getTotpSecret();
  const recoveryCodesRemaining = secret ? await getRecoveryCodeCount() : 0;

  return (
    <SecurityContent
      initialTwoFa={{ enabled: !!secret, recoveryCodesRemaining }}
    />
  );
}

import * as OTPAuth from "otpauth";
import QRCode from "qrcode";
import { prisma } from "./db";

const ISSUER = "Lakeside Retreat Admin";
const LABEL = "admin";

export function generateTotpSecret(): string {
  return new OTPAuth.Secret({ size: 20 }).base32;
}

export function totpUri(secret: string): string {
  const totp = new OTPAuth.TOTP({
    issuer: ISSUER,
    label: LABEL,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  });
  return totp.toString();
}

export async function generateQrCode(secret: string): Promise<string> {
  return QRCode.toDataURL(totpUri(secret));
}

export function verifyTotp(secret: string, token: string): boolean {
  const totp = new OTPAuth.TOTP({
    issuer: ISSUER,
    label: LABEL,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  });
  // window: 1 allows ±30s clock drift
  return totp.validate({ token, window: 1 }) !== null;
}

export async function getTotpSecret(): Promise<string | null> {
  try {
    const row = await prisma.system_settings.findUnique({
      where: { setting_key: "admin_totp_secret" },
    });
    return row?.setting_value ?? null;
  } catch {
    return null;
  }
}

export async function saveTotpSecret(secret: string): Promise<void> {
  await prisma.system_settings.upsert({
    where: { setting_key: "admin_totp_secret" },
    create: { setting_key: "admin_totp_secret", setting_value: secret, setting_type: "secret" },
    update: { setting_value: secret, updated_at: new Date() },
  });
}

export async function deleteTotpSecret(): Promise<void> {
  await prisma.system_settings.deleteMany({
    where: { setting_key: "admin_totp_secret" },
  });
}

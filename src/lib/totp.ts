import * as OTPAuth from "otpauth";
import QRCode from "qrcode";
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { prisma } from "./db";

const ISSUER = "Lakeside Retreat Admin";
const LABEL = "admin";

// TOTP secrets are encrypted at rest with AES-256-GCM. If the DB is breached,
// the ciphertext alone is useless without TOTP_ENCRYPTION_KEY. Rows written
// before this change are plain base32 (no "v1:" prefix) and still readable —
// they get re-encrypted the next time saveTotpSecret runs (e.g. on 2FA setup).
const CIPHER_PREFIX = "v1:";

if (!process.env.TOTP_ENCRYPTION_KEY && process.env.NODE_ENV === "production") {
  throw new Error("TOTP_ENCRYPTION_KEY must be set in production");
}

function getEncryptionKey(): Buffer {
  const hex = process.env.TOTP_ENCRYPTION_KEY ?? "";
  if (hex.length !== 64) {
    throw new Error("TOTP_ENCRYPTION_KEY must be a 64-char hex string (32 bytes)");
  }
  return Buffer.from(hex, "hex");
}

function encryptSecret(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${CIPHER_PREFIX}${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted.toString("base64")}`;
}

function decryptSecret(stored: string): string {
  if (!stored.startsWith(CIPHER_PREFIX)) {
    // Legacy plaintext row — return as-is. Will be re-encrypted on next save.
    return stored;
  }
  const parts = stored.slice(CIPHER_PREFIX.length).split(":");
  if (parts.length !== 3) throw new Error("Malformed encrypted TOTP secret");
  const [ivB64, tagB64, dataB64] = parts;
  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(tagB64, "base64");
  const data = Buffer.from(dataB64, "base64");
  const decipher = createDecipheriv("aes-256-gcm", getEncryptionKey(), iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

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
    if (!row?.setting_value) return null;
    return decryptSecret(row.setting_value);
  } catch {
    return null;
  }
}

export async function saveTotpSecret(secret: string): Promise<void> {
  const encrypted = encryptSecret(secret);
  await prisma.system_settings.upsert({
    where: { setting_key: "admin_totp_secret" },
    create: { setting_key: "admin_totp_secret", setting_value: encrypted, setting_type: "secret" },
    update: { setting_value: encrypted, updated_at: new Date() },
  });
}

export async function deleteTotpSecret(): Promise<void> {
  await prisma.system_settings.deleteMany({
    where: { setting_key: "admin_totp_secret" },
  });
}

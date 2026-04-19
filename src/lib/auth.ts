import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { createHash } from "crypto";
import { prisma } from "./db";

export interface AdminPayload {
  username: string;
  role: "admin";
  iat: number;
  exp: number;
}

// Fail loudly at boot rather than silently minting/verifying tokens with
// an empty key. Mirrors the guard in csrf.ts.
if (!process.env.JWT_SECRET && process.env.NODE_ENV === "production") {
  throw new Error("JWT_SECRET must be set in production");
}

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET ?? "");
const COOKIE_NAME = "auth-token";
const TOKEN_EXPIRY = "1h";

export { COOKIE_NAME };

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function getAdminPasswordHash(): Promise<string> {
  try {
    const setting = await prisma.system_settings.findUnique({
      where: { setting_key: "admin_password_hash" },
    });
    if (setting?.setting_value) return setting.setting_value;
  } catch {
    // DB not available, fall back to env
  }
  return process.env.ADMIN_PASSWORD_HASH ?? "";
}

export async function createToken(username: string): Promise<string> {
  return new SignJWT({ username, role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .setIssuer("lakeside-retreat")
    .setAudience("admin-panel")
    .sign(JWT_SECRET);
}

export async function verifyToken(
  token: string
): Promise<AdminPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: "lakeside-retreat",
      audience: "admin-panel",
    });

    // Check blacklist
    const hash = hashToken(token);
    const blacklisted = await prisma.token_blacklist
      .findUnique({ where: { token_hash: hash } })
      .catch(() => null);

    if (blacklisted) return null;

    return payload as unknown as AdminPayload;
  } catch {
    return null;
  }
}

export async function blacklistToken(token: string): Promise<void> {
  try {
    const hash = hashToken(token);
    // Token expires in 1 hour, keep blacklist entry for 2 hours
    const expires_at = new Date(Date.now() + 2 * 60 * 60 * 1000);
    await prisma.token_blacklist.upsert({
      where: { token_hash: hash },
      update: { expires_at },
      create: { token_hash: hash, expires_at },
    });
  } catch {
    // Silently fail — worst case token remains valid until expiry
  }
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// Clean expired blacklist entries (call periodically)
export async function cleanExpiredTokens(): Promise<void> {
  try {
    await prisma.token_blacklist.deleteMany({
      where: { expires_at: { lt: new Date() } },
    });
  } catch {
    // Ignore cleanup errors
  }
}

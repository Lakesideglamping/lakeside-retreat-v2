import { NextResponse } from "next/server";
import {
  verifyPassword,
  getAdminPasswordHash,
  createToken,
  COOKIE_NAME,
} from "@/lib/auth";
import { loginSchema } from "@/lib/admin-validations";
import { checkRateLimit } from "@/lib/rate-limit";
import { auditLog } from "@/lib/audit";
import {
  getFailedAttempt,
  deleteFailedAttempt,
  recordFailedAttempt,
} from "@/lib/login-attempts";
import { getTotpSecret, verifyTotp, consumeRecoveryCode } from "@/lib/totp";
import { logger } from "@/lib/logger";
import { getClientIp } from "@/lib/admin-route";

export async function POST(request: Request) {
  const ip = getClientIp(request);

  // Check exponential backoff
  const attempt = await getFailedAttempt(ip);
  if (attempt && attempt.lockedUntil > Date.now()) {
    const waitSeconds = Math.ceil((attempt.lockedUntil - Date.now()) / 1000);
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${waitSeconds} seconds.` },
      { status: 429 }
    );
  }

  // Rate limit: 3 per 15 minutes
  const rateCheck = await checkRateLimit(`login:${ip}`, 15 * 60 * 1000, 3);
  if (!rateCheck.success) {
    return NextResponse.json(
      { error: "Too many login attempts. Please wait 15 minutes." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 400 }
      );
    }

    const { username, password } = parsed.data;

    // Verify username
    if (username !== process.env.ADMIN_USERNAME) {
      await recordFailedAttempt(ip);
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Verify password against bcrypt hash (DB-first, then ADMIN_PASSWORD_HASH env).
    // Note: plain-text ADMIN_PASSWORD support has been removed — only hashes are accepted.
    const hash = await getAdminPasswordHash();
    const valid = await verifyPassword(password, hash);

    if (!valid) {
      await recordFailedAttempt(ip);
      await auditLog("unknown", "login_failed", { username, ip });

      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Success — clear failed attempts
    await deleteFailedAttempt(ip);

    // Check if 2FA is enabled. If so, require a valid TOTP code before issuing JWT.
    const totpSecret = await getTotpSecret();
    if (totpSecret) {
      const { totpCode, recoveryCode } = parsed.data as {
        totpCode?: string;
        recoveryCode?: string;
      };
      if (!totpCode && !recoveryCode) {
        // Password correct — tell client to prompt for the TOTP code
        return NextResponse.json({ require2FA: true });
      }
      let ok = false;
      if (totpCode) {
        ok = verifyTotp(totpSecret, totpCode);
      } else if (recoveryCode) {
        ok = await consumeRecoveryCode(recoveryCode);
        if (ok) {
          await auditLog(username, "2fa_recovery_used", { ip });
        }
      }
      if (!ok) {
        await recordFailedAttempt(ip);
        await auditLog("unknown", "2fa_failed", { username, ip });
        return NextResponse.json(
          { error: "Invalid verification code" },
          { status: 401 }
        );
      }
    }

    // Create JWT
    const token = await createToken(username);

    await auditLog(username, "login_success", { ip });

    const response = NextResponse.json({ success: true });
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 3600, // 1 hour
      path: "/",
    });

    return response;
  } catch (error) {
    logger.error("Login error", { err: error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


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

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  // Check exponential backoff
  const attempt = getFailedAttempt(ip);
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
      recordFailedAttempt(ip);
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
      recordFailedAttempt(ip);
      await auditLog("unknown", "login_failed", { username, ip });

      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Success — clear failed attempts
    deleteFailedAttempt(ip);

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
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


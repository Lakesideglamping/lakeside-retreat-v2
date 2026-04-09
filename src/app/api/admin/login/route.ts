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

// Track failed attempts for exponential backoff
const failedAttempts = new Map<
  string,
  { count: number; lockedUntil: number }
>();

export function clearFailedAttempts(): void {
  failedAttempts.clear();
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  // Check exponential backoff
  const attempt = failedAttempts.get(ip);
  if (attempt && attempt.lockedUntil > Date.now()) {
    const waitSeconds = Math.ceil((attempt.lockedUntil - Date.now()) / 1000);
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${waitSeconds} seconds.` },
      { status: 429 }
    );
  }

  // Rate limit: 3 per 15 minutes
  const rateCheck = checkRateLimit(`login:${ip}`, 15 * 60 * 1000, 3);
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

    // Verify password
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
    failedAttempts.delete(ip);

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

function recordFailedAttempt(ip: string): void {
  const current = failedAttempts.get(ip);
  const count = (current?.count ?? 0) + 1;

  if (count >= 3) {
    // Exponential backoff: 1min, 2min, 4min, 8min... max 30min
    const lockMinutes = Math.min(Math.pow(2, count - 3), 30);
    failedAttempts.set(ip, {
      count,
      lockedUntil: Date.now() + lockMinutes * 60 * 1000,
    });
  } else {
    failedAttempts.set(ip, { count, lockedUntil: 0 });
  }
}

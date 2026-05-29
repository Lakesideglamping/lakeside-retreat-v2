import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

/**
 * Postgres-backed failed-login tracking (exponential backoff).
 *
 * Previously this was an in-memory Map, which meant any Render restart
 * or deploy wiped the counters — an attacker could reset the lockout by
 * triggering a restart (or just waiting for a cold-scale cycle). The DB
 * version survives restarts and is shared across instances.
 *
 * Schema: login_attempts(ip PK, count, locked_until, updated_at).
 * Stale rows sit until a manual sweep; at this scale it's a few KB. If
 * it ever matters, add a periodic DELETE WHERE locked_until < now() -
 * interval '7 days' AND count < 3.
 *
 * FAIL-OPEN: every function below swallows DB errors and logs them. This
 * is brute-force tracking layered on top of the actual credential check
 * (bcrypt against ADMIN_PASSWORD_HASH, which doesn't need the DB). If the
 * database has a transient blip, we must NOT turn that into a total admin
 * lockout — getFailedAttempt returning null means "no prior lockout, let
 * the credential check proceed", and credentials are still required. This
 * mirrors the fail-open behaviour of lib/rate-limit.ts.
 */

export type FailedAttempt = {
  count: number;
  lockedUntil: number;
};

export async function getFailedAttempt(
  ip: string
): Promise<FailedAttempt | null> {
  try {
    const row = await prisma.login_attempts.findUnique({ where: { ip } });
    if (!row) return null;
    return {
      count: row.count,
      lockedUntil: row.locked_until.getTime(),
    };
  } catch (err) {
    // Fail open: a DB outage must not brick admin login. No lockout applied.
    logger.error("login-attempts: getFailedAttempt failed (failing open)", {
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

export async function deleteFailedAttempt(ip: string): Promise<void> {
  try {
    await prisma.login_attempts.deleteMany({ where: { ip } });
  } catch (err) {
    logger.error("login-attempts: deleteFailedAttempt failed", {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

export async function clearAllFailedAttempts(): Promise<void> {
  await prisma.login_attempts.deleteMany({});
}

export async function recordFailedAttempt(ip: string): Promise<void> {
  try {
    const existing = await prisma.login_attempts.findUnique({ where: { ip } });
    const count = (existing?.count ?? 0) + 1;

    let lockedUntil: Date;
    if (count >= 3) {
      // Exponential backoff: 1min, 2min, 4min... capped at 30min.
      const lockMinutes = Math.min(Math.pow(2, count - 3), 30);
      lockedUntil = new Date(Date.now() + lockMinutes * 60 * 1000);
    } else {
      lockedUntil = new Date(0);
    }

    await prisma.login_attempts.upsert({
      where: { ip },
      create: {
        ip,
        count,
        locked_until: lockedUntil,
        updated_at: new Date(),
      },
      update: {
        count,
        locked_until: lockedUntil,
        updated_at: new Date(),
      },
    });
  } catch (err) {
    // Fail open: if we can't record the attempt, still return a clean 401
    // to the caller rather than a 500. Brute-force tracking is degraded
    // for this request only.
    logger.error("login-attempts: recordFailedAttempt failed", {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

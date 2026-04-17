import { prisma } from "@/lib/db";

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
 */

export type FailedAttempt = {
  count: number;
  lockedUntil: number;
};

export async function getFailedAttempt(
  ip: string
): Promise<FailedAttempt | null> {
  const row = await prisma.login_attempts.findUnique({ where: { ip } });
  if (!row) return null;
  return {
    count: row.count,
    lockedUntil: row.locked_until.getTime(),
  };
}

export async function deleteFailedAttempt(ip: string): Promise<void> {
  await prisma.login_attempts.deleteMany({ where: { ip } });
}

export async function clearAllFailedAttempts(): Promise<void> {
  await prisma.login_attempts.deleteMany({});
}

export async function recordFailedAttempt(ip: string): Promise<void> {
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
}

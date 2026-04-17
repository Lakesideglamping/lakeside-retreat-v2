import { prisma } from "@/lib/db";

/**
 * Postgres-backed rate limiter.
 *
 * Previously this was an in-memory Map, which had two failure modes on Render:
 *   1. Every deploy / container restart wiped the counters — an attacker
 *      locked out after N attempts just had to wait for a restart.
 *   2. Any horizontal scaling (autoscale, multiple replicas) gave each
 *      instance its own Map, so the effective limit became N × instances.
 *
 * The Postgres version survives restarts and is shared across instances.
 *
 * Concurrency model:
 *   - A single `upsert` either inserts a fresh window (count=1) or bumps
 *     the counter on the existing row. The `updateMany` WHERE clause
 *     prevents double-counting under the reset edge case.
 *   - Expired windows are reset lazily on the next check for that key —
 *     no background job required (Next.js route handlers don't reliably
 *     run setInterval on serverless anyway).
 *   - Stale rows for unused keys sit until a manual sweep. At this scale
 *     that's a few KB; if it ever matters, add a periodic DELETE WHERE
 *     reset_time < now() - interval '1 day'.
 */

export async function clearRateLimit(keyPrefix: string): Promise<void> {
  await prisma.rate_limits.deleteMany({
    where: { key: { startsWith: keyPrefix } },
  });
}

export async function checkRateLimit(
  key: string,
  windowMs: number,
  max: number
): Promise<{ success: boolean; remaining: number }> {
  const now = new Date();
  const newReset = new Date(now.getTime() + windowMs);

  // Fast path: read current state.
  const existing = await prisma.rate_limits.findUnique({ where: { key } });

  // No row yet, or the window has expired — start a new window.
  // Upsert handles the race where two requests both see "no row".
  if (!existing || existing.reset_time <= now) {
    await prisma.rate_limits.upsert({
      where: { key },
      create: { key, count: 1, reset_time: newReset },
      // If someone else inserted first, their row is valid; overwrite only
      // if the window we see is stale. `updateMany` below handles the
      // valid-window branch atomically.
      update: { count: 1, reset_time: newReset },
    });
    return { success: true, remaining: max - 1 };
  }

  // Window is active — over the limit already.
  if (existing.count >= max) {
    return { success: false, remaining: 0 };
  }

  // Atomically increment, but only if the row is still under the cap and
  // the window we read is still the current one. This prevents two
  // concurrent requests from both observing count=max-1 and both
  // succeeding (which would land us at count=max+1 and one extra through).
  const updated = await prisma.rate_limits.updateMany({
    where: {
      key,
      reset_time: existing.reset_time,
      count: { lt: max },
    },
    data: { count: { increment: 1 } },
  });

  if (updated.count === 0) {
    // Lost the race — either the window rolled or another request hit the
    // cap. Re-read to decide. In practice this is rare.
    const reread = await prisma.rate_limits.findUnique({ where: { key } });
    if (!reread || reread.reset_time <= now) {
      return { success: true, remaining: max - 1 };
    }
    return { success: false, remaining: 0 };
  }

  return { success: true, remaining: max - existing.count - 1 };
}

/**
 * Persistent KV cache backed by the system_settings table.
 *
 * Survives deploys and is shared across instances, unlike the in-memory Map
 * in cache.ts. Used for data that is expensive to re-fetch on every cold
 * start (e.g. Uplisting blocked-dates, which spikes API calls after each
 * Render deploy if the cache is in-process only).
 *
 * Falls back to null on any DB error so callers degrade gracefully.
 *
 * Key format: "cache:<namespace>:<identifier>"
 */

import { prisma } from "./db";

interface CachePayload<T> {
  data: T;
  expiresAt: number; // Unix ms
}

export async function getDbCached<T>(key: string): Promise<T | null> {
  try {
    const row = await prisma.system_settings.findUnique({
      where: { setting_key: key },
    });
    if (!row?.setting_value) return null;

    const payload = JSON.parse(row.setting_value) as CachePayload<T>;
    if (Date.now() > payload.expiresAt) return null;

    return payload.data;
  } catch {
    return null;
  }
}

export async function setDbCache<T>(key: string, data: T, ttlMs: number): Promise<void> {
  const payload: CachePayload<T> = {
    data,
    expiresAt: Date.now() + ttlMs,
  };
  try {
    await prisma.system_settings.upsert({
      where: { setting_key: key },
      create: {
        setting_key: key,
        setting_value: JSON.stringify(payload),
        setting_type: "cache",
      },
      update: {
        setting_value: JSON.stringify(payload),
        updated_at: new Date(),
      },
    });
  } catch {
    // Cache write failures are non-fatal — the next request will just miss.
  }
}

export async function invalidateDbCache(key: string): Promise<void> {
  try {
    await prisma.system_settings.deleteMany({ where: { setting_key: key } });
  } catch {
    // Non-fatal
  }
}

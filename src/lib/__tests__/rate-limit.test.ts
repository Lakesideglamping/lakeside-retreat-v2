/**
 * Guards the Postgres-backed rate limiter contract:
 *   1. First N requests within a window succeed with decreasing remaining.
 *   2. Request N+1 is rejected.
 *   3. After the window expires, a fresh window opens and the counter resets.
 *   4. clearRateLimit wipes rows by prefix.
 *
 * Prisma is mocked with a simple in-memory table so we exercise the
 * real upsert/updateMany branching in rate-limit.ts without a DB.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

type Row = { key: string; count: number; reset_time: Date };
const table = new Map<string, Row>();

vi.mock("../db", () => ({
  prisma: {
    rate_limits: {
      findUnique: vi.fn(async ({ where }: { where: { key: string } }) => {
        return table.get(where.key) ?? null;
      }),
      upsert: vi.fn(
        async ({
          where,
          create,
          update,
        }: {
          where: { key: string };
          create: Row;
          update: { count: number; reset_time: Date };
        }) => {
          const existing = table.get(where.key);
          if (existing) {
            existing.count = update.count;
            existing.reset_time = update.reset_time;
          } else {
            table.set(where.key, { ...create });
          }
        }
      ),
      updateMany: vi.fn(
        async ({
          where,
          data,
        }: {
          where: { key: string; reset_time: Date; count: { lt: number } };
          data: { count: { increment: number } };
        }) => {
          const row = table.get(where.key);
          if (
            !row ||
            row.reset_time.getTime() !== where.reset_time.getTime() ||
            row.count >= where.count.lt
          ) {
            return { count: 0 };
          }
          row.count += data.count.increment;
          return { count: 1 };
        }
      ),
      deleteMany: vi.fn(async ({ where }: { where: { key: { startsWith: string } } }) => {
        let n = 0;
        for (const k of Array.from(table.keys())) {
          if (k.startsWith(where.key.startsWith)) {
            table.delete(k);
            n++;
          }
        }
        return { count: n };
      }),
    },
  },
}));

import { checkRateLimit, clearRateLimit } from "../rate-limit";

beforeEach(() => {
  table.clear();
});

describe("checkRateLimit", () => {
  it("allows first request and reports remaining = max - 1", async () => {
    const r = await checkRateLimit("test:a", 60_000, 3);
    expect(r).toEqual({ success: true, remaining: 2 });
  });

  it("enforces the cap within a single window", async () => {
    const key = "test:cap";
    const a = await checkRateLimit(key, 60_000, 3);
    const b = await checkRateLimit(key, 60_000, 3);
    const c = await checkRateLimit(key, 60_000, 3);
    const d = await checkRateLimit(key, 60_000, 3);
    expect(a.success).toBe(true);
    expect(b.success).toBe(true);
    expect(c.success).toBe(true);
    expect(d).toEqual({ success: false, remaining: 0 });
  });

  it("opens a fresh window when the previous one has expired", async () => {
    const key = "test:roll";
    await checkRateLimit(key, 60_000, 2);
    await checkRateLimit(key, 60_000, 2);
    const blocked = await checkRateLimit(key, 60_000, 2);
    expect(blocked.success).toBe(false);

    // Simulate window expiry by back-dating reset_time.
    const row = table.get(key)!;
    row.reset_time = new Date(Date.now() - 1000);

    const afterRoll = await checkRateLimit(key, 60_000, 2);
    expect(afterRoll).toEqual({ success: true, remaining: 1 });
  });

  it("isolates counters across keys", async () => {
    await checkRateLimit("test:k1", 60_000, 1);
    const r = await checkRateLimit("test:k2", 60_000, 1);
    expect(r.success).toBe(true);
  });
});

describe("clearRateLimit", () => {
  it("removes all rows matching the prefix", async () => {
    await checkRateLimit("admin-login:1.2.3.4", 60_000, 5);
    await checkRateLimit("admin-login:5.6.7.8", 60_000, 5);
    await checkRateLimit("other:x", 60_000, 5);

    await clearRateLimit("admin-login:");

    expect(table.has("admin-login:1.2.3.4")).toBe(false);
    expect(table.has("admin-login:5.6.7.8")).toBe(false);
    expect(table.has("other:x")).toBe(true);
  });
});

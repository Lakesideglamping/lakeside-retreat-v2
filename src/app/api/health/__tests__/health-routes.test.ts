import { describe, it, expect, beforeEach, vi } from "vitest";

/**
 * These two routes exist to keep a third party's bad day from becoming an
 * outage here. The properties below are the whole point of that split, and both
 * are easy to undo by accident — a 503 looks like the "correct" thing to return
 * when a dependency is down, which is how the original version came about.
 *
 * On 2026-09-18 /api/health returned 503 whenever Stripe or Uplisting answered
 * slower than three seconds. Render reads a failing health check as grounds to
 * restart or de-rotate the instance, so someone else's latency could take the
 * whole site off the air.
 */

const checkHealth = vi.fn();
vi.mock("@/lib/health", () => ({ checkHealth: () => checkHealth() }));

beforeEach(() => {
  checkHealth.mockReset();
});

describe("/api/health — liveness", () => {
  it("returns 200 without consulting any dependency", async () => {
    const { GET } = await import("../route");
    const res = await GET();

    expect(res.status).toBe(200);
    // The critical assertion: no dependency was probed at all, so no third
    // party can influence whether this instance is considered alive.
    expect(checkHealth).not.toHaveBeenCalled();
  });

  it("reports nothing about dependencies", async () => {
    const { GET } = await import("../route");
    const body = await (await GET()).json();

    expect(body.status).toBe("ok");
    expect(body).not.toHaveProperty("database");
    expect(body).not.toHaveProperty("services");
  });
});

describe("/api/health/detail — diagnostics", () => {
  it("returns 200 when everything is healthy", async () => {
    checkHealth.mockResolvedValue({
      status: "ok",
      timestamp: "t",
      database: "connected",
      services: { stripe: "ok", email: true, uplisting: "ok" },
    });

    const { GET } = await import("../detail/route");
    const res = await GET();
    expect(res.status).toBe(200);
    expect((await res.json()).status).toBe("ok");
  });

  it.each([
    ["uplisting unreachable", { stripe: "ok", email: true, uplisting: "unreachable" }],
    ["stripe unreachable", { stripe: "unreachable", email: true, uplisting: "ok" }],
    ["both unreachable", { stripe: "unreachable", email: true, uplisting: "unreachable" }],
  ])(
    "still returns 200 with %s — the body carries the bad news, not the status code",
    async (_label, services) => {
      checkHealth.mockResolvedValue({
        status: "degraded",
        timestamp: "t",
        database: "connected",
        services,
      });

      const { GET } = await import("../detail/route");
      const res = await GET();

      // 200 means "this service answered you", not "everything is fine".
      // Alerting matches on the body; Render must not be told to restart
      // because Uplisting is down, since restarting fixes nothing and costs
      // the warm image cache.
      expect(res.status, "a degraded dependency must not produce a 5xx").toBe(200);
      expect((await res.json()).status).toBe("degraded");
    }
  );

  it("still returns 200 when the database is down", async () => {
    checkHealth.mockResolvedValue({
      status: "degraded",
      timestamp: "t",
      database: "disconnected",
      services: { stripe: "ok", email: true, uplisting: "ok" },
    });

    const { GET } = await import("../detail/route");
    const res = await GET();
    expect(res.status).toBe(200);
    expect((await res.json()).database).toBe("disconnected");
  });
});

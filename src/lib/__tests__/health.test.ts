import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

/**
 * Guards the cancellation fix.
 *
 * checkHealth used to wrap its outbound calls in a Promise.race against a
 * setTimeout. Racing settles the wrapper, not the work: the HTTP request kept
 * running and its socket stayed open long after the probe had reported
 * "unreachable". Render, UptimeRobot and Sentry all poll this on a schedule, so
 * a hanging upstream would leave a dangling socket behind on every poll.
 *
 * That is the same shape as the Sentry tunnel outage documented in
 * next.config.ts, where hanging outbound sockets accumulated faster than they
 * cleared until nothing was served at all. A timeout that does not cancel is
 * not a timeout, so the assertions below are about cancellation specifically.
 */

const queryRaw = vi.fn();
const balanceRetrieve = vi.fn();

vi.mock("../db", () => ({ prisma: { $queryRaw: (...a: unknown[]) => queryRaw(...a) } }));
vi.mock("../stripe", () => ({
  stripe: { balance: { retrieve: (...a: unknown[]) => balanceRetrieve(...(a as [])) } },
}));

const originalFetch = global.fetch;

beforeEach(() => {
  queryRaw.mockReset().mockResolvedValue([{ "?column?": 1 }]);
  balanceRetrieve.mockReset().mockResolvedValue({ object: "balance" });
  process.env.STRIPE_SECRET_KEY = "sk_test_x";
  process.env.UPLISTING_API_KEY = "up_test_x";
});

afterEach(() => {
  global.fetch = originalFetch;
});

describe("outbound probes are cancellable", () => {
  it("passes an abort signal to the Uplisting fetch", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    global.fetch = fetchMock as unknown as typeof fetch;

    const { checkHealth } = await import("../health");
    await checkHealth();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(
      init.signal,
      "without a signal the socket outlives the probe — see the Sentry outage"
    ).toBeInstanceOf(AbortSignal);
  });

  it("gives Stripe its own request timeout rather than walking away", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200 }) as unknown as typeof fetch;

    const { checkHealth } = await import("../health");
    await checkHealth();

    const opts = balanceRetrieve.mock.calls[0]?.[1] as { timeout?: number } | undefined;
    expect(opts?.timeout, "the SDK must abort the request itself").toBeTypeOf("number");
  });
});

describe("a failing dependency is reported, not thrown", () => {
  it("marks Uplisting unreachable when the request aborts", async () => {
    global.fetch = vi
      .fn()
      .mockRejectedValue(Object.assign(new Error("aborted"), { name: "TimeoutError" })) as unknown as typeof fetch;

    const { checkHealth } = await import("../health");
    const h = await checkHealth();

    expect(h.services.uplisting).toBe("unreachable");
    expect(h.status).toBe("degraded");
    // Still a complete, well-formed report — the route turns this into a 200.
    expect(h.database).toBe("connected");
  });

  it("marks the database disconnected without taking the rest down with it", async () => {
    queryRaw.mockRejectedValue(new Error("no connection"));
    global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200 }) as unknown as typeof fetch;

    const { checkHealth } = await import("../health");
    const h = await checkHealth();

    expect(h.database).toBe("disconnected");
    expect(h.services.uplisting).toBe("ok");
    expect(h.status).toBe("degraded");
  });
});

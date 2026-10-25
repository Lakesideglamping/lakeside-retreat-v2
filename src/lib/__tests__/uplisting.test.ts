/**
 * Guards the Uplisting integration boundaries that aren't end-to-end
 * testable against the real API:
 *   1. nzDateString lands in Pacific/Auckland regardless of host TZ.
 *   2. isConfigured reflects UPLISTING_API_KEY presence.
 *   3. fetchBlockedDates returns [] without a key and parses the API shape.
 *   4. checkAvailability treats an unconfigured prod env as fail-closed.
 *   5. verifyWebhookSignature matches only on correct HMAC, constant-time.
 *
 * Caches are mocked so we always hit the mocked `fetch`.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import crypto from "crypto";

vi.mock("../cache", () => ({
  getCached: vi.fn(() => null),
  setCache: vi.fn(),
}));

vi.mock("../db-cache", () => ({
  getDbCached: vi.fn(async () => null),
  setDbCache: vi.fn(async () => {}),
  invalidateDbCache: vi.fn(async () => {}),
}));

// The durable rates cache (uplisting_rates). Each test that cares reaches
// the mocked functions through `import("../db")` after vi.resetModules().
vi.mock("../db", () => ({
  prisma: {
    uplisting_rates: {
      findUnique: vi.fn(async () => null),
      upsert: vi.fn(async () => ({})),
    },
  },
}));

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  vi.resetModules();
  process.env = { ...ORIGINAL_ENV };
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("nzDateString", () => {
  it("formats as YYYY-MM-DD in Pacific/Auckland", async () => {
    const { nzDateString } = await import("../uplisting");
    // 2026-04-19 11:00 UTC → 2026-04-19 23:00 NZST (same day)
    expect(nzDateString(new Date("2026-04-19T11:00:00Z"))).toBe("2026-04-19");
    // 2026-04-19 23:00 UTC → 2026-04-20 11:00 NZST (next day)
    expect(nzDateString(new Date("2026-04-19T23:00:00Z"))).toBe("2026-04-20");
  });

  it("pads single-digit month/day", async () => {
    const { nzDateString } = await import("../uplisting");
    const out = nzDateString(new Date("2026-01-05T06:00:00Z"));
    expect(out).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("isConfigured", () => {
  it("returns false without UPLISTING_API_KEY", async () => {
    delete process.env.UPLISTING_API_KEY;
    const { isConfigured } = await import("../uplisting");
    expect(isConfigured()).toBe(false);
  });

  it("returns true with UPLISTING_API_KEY set", async () => {
    process.env.UPLISTING_API_KEY = "test-key";
    const { isConfigured } = await import("../uplisting");
    expect(isConfigured()).toBe(true);
  });
});

describe("fetchBlockedDates", () => {
  it("returns [] when no API key is set (dev/staging)", async () => {
    delete process.env.UPLISTING_API_KEY;
    const { fetchBlockedDates } = await import("../uplisting");
    expect(await fetchBlockedDates("dome-pinot")).toEqual([]);
  });

  it("returns [] for an unknown accommodation slug", async () => {
    process.env.UPLISTING_API_KEY = "k";
    process.env.UPLISTING_PINOT_ID = "123";
    const { fetchBlockedDates } = await import("../uplisting");
    expect(await fetchBlockedDates("not-a-real-property")).toEqual([]);
  });

  it("extracts unavailable dates from the calendar response", async () => {
    process.env.UPLISTING_API_KEY = "k";
    process.env.UPLISTING_PINOT_ID = "123";
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          calendar: {
            days: [
              { date: "2026-05-01", available: true },
              { date: "2026-05-02", available: false },
              { date: "2026-05-03", available: false },
              { date: "2026-05-04", available: true },
            ],
          },
        }),
        { status: 200 }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const { fetchBlockedDates } = await import("../uplisting");
    const blocked = await fetchBlockedDates("dome-pinot");
    expect(blocked).toEqual(["2026-05-02", "2026-05-03"]);
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});

describe("checkAvailability", () => {
  it("fails closed in production when the API is unconfigured", async () => {
    delete process.env.UPLISTING_API_KEY;
    const prev = process.env.NODE_ENV;
    // @ts-expect-error writing a test-only NODE_ENV
    process.env.NODE_ENV = "production";
    try {
      const { checkAvailability } = await import("../uplisting");
      expect(
        await checkAvailability("dome-pinot", "2026-05-01", "2026-05-03")
      ).toBe(false);
    } finally {
      // @ts-expect-error restoring
      process.env.NODE_ENV = prev;
    }
  });

  it("fails open in non-production when unconfigured (so dev works)", async () => {
    delete process.env.UPLISTING_API_KEY;
    // @ts-expect-error NODE_ENV is readonly
    process.env.NODE_ENV = "test";
    const { checkAvailability } = await import("../uplisting");
    expect(
      await checkAvailability("dome-pinot", "2026-05-01", "2026-05-03")
    ).toBe(true);
  });
});

describe("verifyWebhookSignature", () => {
  it("accepts a matching HMAC-SHA256 hex signature", async () => {
    process.env.UPLISTING_WEBHOOK_SECRET = "shh";
    const body = '{"event":"booking.created"}';
    const sig = crypto.createHmac("sha256", "shh").update(body).digest("hex");
    const { verifyWebhookSignature } = await import("../uplisting");
    expect(verifyWebhookSignature(body, sig)).toBe(true);
  });

  it("rejects a tampered body", async () => {
    process.env.UPLISTING_WEBHOOK_SECRET = "shh";
    const sig = crypto.createHmac("sha256", "shh").update("original").digest("hex");
    const { verifyWebhookSignature } = await import("../uplisting");
    expect(verifyWebhookSignature("tampered", sig)).toBe(false);
  });

  it("rejects when no secret is configured", async () => {
    delete process.env.UPLISTING_WEBHOOK_SECRET;
    const { verifyWebhookSignature } = await import("../uplisting");
    expect(verifyWebhookSignature("body", "sig")).toBe(false);
  });

  it("rejects signatures of different length (avoids timingSafeEqual throw)", async () => {
    process.env.UPLISTING_WEBHOOK_SECRET = "shh";
    const { verifyWebhookSignature } = await import("../uplisting");
    expect(verifyWebhookSignature("body", "tooshort")).toBe(false);
  });
});

describe("fetchNightlyRates", () => {
  const calendarResponse = (days: Array<{ date: string; day_rate: number }>) =>
    new Response(
      JSON.stringify({
        calendar: {
          days: days.map((d) => ({
            available: true,
            available_count: 1,
            date: d.date,
            day_rate: d.day_rate,
            minimum_length_of_stay: 1,
          })),
        },
      }),
      { status: 200 }
    );

  async function loadWithDb() {
    const { prisma } = await import("../db");
    const table = prisma.uplisting_rates as unknown as {
      findUnique: ReturnType<typeof vi.fn>;
      upsert: ReturnType<typeof vi.fn>;
    };
    // vi.resetModules() does not reset the mock registry, so a
    // mockResolvedValue set by one test would otherwise leak into the next.
    table.findUnique.mockReset().mockResolvedValue(null);
    table.upsert.mockReset().mockResolvedValue({});
    const mod = await import("../uplisting");
    return { ...mod, findUnique: table.findUnique, upsert: table.upsert };
  }

  beforeEach(() => {
    process.env.UPLISTING_API_KEY = "k";
    process.env.UPLISTING_PINOT_ID = "82753";
  });

  it("parses day_rate per date from the live calendar and stores it in Postgres", async () => {
    const fetchMock = vi.fn(async () =>
      calendarResponse([
        { date: "2026-12-01", day_rate: 579 },
        { date: "2026-12-02", day_rate: 579 },
        { date: "2026-12-03", day_rate: 650 },
      ])
    );
    vi.stubGlobal("fetch", fetchMock);
    const { fetchNightlyRates, upsert } = await loadWithDb();

    const result = await fetchNightlyRates("dome-pinot");
    expect(result).not.toBeNull();
    expect(result!.source).toBe("live");
    expect(result!.rates).toEqual({
      "2026-12-01": 579,
      "2026-12-02": 579,
      "2026-12-03": 650,
    });
    expect(fetchMock).toHaveBeenCalledOnce();
    // The calendar is asked for in NZ calendar dates.
    const url = String((fetchMock.mock.calls as unknown as [string][])[0][0]);
    expect(url).toMatch(/\/calendar\/82753\?from=\d{4}-\d{2}-\d{2}&to=\d{4}-\d{2}-\d{2}$/);

    // Give the fire-and-forget write a tick to land.
    await new Promise((r) => setTimeout(r, 0));
    expect(upsert).toHaveBeenCalledOnce();
    const call = upsert.mock.calls[0][0] as { create: { accommodation: string; rates: Record<string, number> } };
    expect(call.create.accommodation).toBe("dome-pinot");
    expect(call.create.rates["2026-12-03"]).toBe(650);
  });

  it("falls back to the last good Postgres copy when the API errors", async () => {
    const fetchMock = vi.fn(async () => new Response("down", { status: 500 }));
    vi.stubGlobal("fetch", fetchMock);
    const { fetchNightlyRates, findUnique } = await loadWithDb();
    const staleFetchedAt = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000); // 3 days old
    findUnique.mockResolvedValue({
      accommodation: "dome-pinot",
      rates: { "2026-12-01": 579 },
      fetched_at: staleFetchedAt,
    });

    const result = await fetchNightlyRates("dome-pinot");
    expect(result).not.toBeNull();
    expect(result!.source).toBe("cached");
    expect(result!.rates).toEqual({ "2026-12-01": 579 });
    expect(result!.fetchedAt).toEqual(staleFetchedAt);
  }, 15_000);

  it("falls back to the Postgres copy when the request throws (network down)", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("ECONNRESET"); }));
    const { fetchNightlyRates, findUnique } = await loadWithDb();
    findUnique.mockResolvedValue({
      accommodation: "dome-pinot",
      rates: { "2026-12-01": 579 },
      fetched_at: new Date(Date.now() - 60 * 60 * 1000),
    });

    const result = await fetchNightlyRates("dome-pinot");
    expect(result?.source).toBe("cached");
    expect(result?.rates["2026-12-01"]).toBe(579);
  }, 15_000);

  it("returns null — never a number — when the API fails and nothing is cached", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("down", { status: 503 })));
    const { fetchNightlyRates } = await loadWithDb();
    expect(await fetchNightlyRates("dome-pinot")).toBeNull();
  }, 15_000);

  it("serves a fresh Postgres copy without calling the API", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { fetchNightlyRates, findUnique } = await loadWithDb();
    findUnique.mockResolvedValue({
      accommodation: "dome-pinot",
      rates: { "2026-12-01": 579 },
      fetched_at: new Date(), // just fetched by another instance
    });

    const result = await fetchNightlyRates("dome-pinot");
    expect(result?.source).toBe("live");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("serves the stored copy when unconfigured, and null when there is none", async () => {
    delete process.env.UPLISTING_API_KEY;
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { fetchNightlyRates, findUnique } = await loadWithDb();
    expect(await fetchNightlyRates("dome-pinot")).toBeNull();
    findUnique.mockResolvedValue({
      accommodation: "dome-pinot",
      rates: { "2026-12-01": 579 },
      fetched_at: new Date(),
    });
    expect((await fetchNightlyRates("dome-pinot"))?.source).toBe("cached");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

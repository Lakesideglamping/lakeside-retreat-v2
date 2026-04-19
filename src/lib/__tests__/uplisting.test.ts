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
    // @ts-expect-error
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

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

describe("verifyCronSecret", () => {
  const originalEnv = process.env.CRON_SECRET;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    process.env.CRON_SECRET = originalEnv;
  });

  it("returns false when CRON_SECRET is not set", async () => {
    delete process.env.CRON_SECRET;
    const { verifyCronSecret } = await import("../cron-auth");
    const req = new Request("http://localhost", {
      headers: { authorization: "Bearer anything" },
    });
    expect(verifyCronSecret(req)).toBe(false);
  });

  it("returns false when authorization header is missing", async () => {
    process.env.CRON_SECRET = "mysecret";
    const { verifyCronSecret } = await import("../cron-auth");
    const req = new Request("http://localhost");
    expect(verifyCronSecret(req)).toBe(false);
  });

  it("returns true for correct Bearer token", async () => {
    process.env.CRON_SECRET = "mysecret";
    const { verifyCronSecret } = await import("../cron-auth");
    const req = new Request("http://localhost", {
      headers: { authorization: "Bearer mysecret" },
    });
    expect(verifyCronSecret(req)).toBe(true);
  });

  it("returns false for wrong token", async () => {
    process.env.CRON_SECRET = "mysecret";
    const { verifyCronSecret } = await import("../cron-auth");
    const req = new Request("http://localhost", {
      headers: { authorization: "Bearer wrongsecret" },
    });
    expect(verifyCronSecret(req)).toBe(false);
  });

  it("returns false for token without Bearer prefix", async () => {
    process.env.CRON_SECRET = "mysecret";
    const { verifyCronSecret } = await import("../cron-auth");
    const req = new Request("http://localhost", {
      headers: { authorization: "mysecret" },
    });
    expect(verifyCronSecret(req)).toBe(false);
  });
});

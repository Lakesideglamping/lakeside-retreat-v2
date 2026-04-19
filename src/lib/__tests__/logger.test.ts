import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { logger, scrub } from "../logger";

// Note: logger caches IS_PROD at module load; we test the dev path (default)
// since the scrub() step runs identically in both. The PII guarantee is
// environment-independent.

describe("logger PII scrubbing", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  function allOutput(): string {
    const calls = [
      ...logSpy.mock.calls,
      ...warnSpy.mock.calls,
      ...errorSpy.mock.calls,
    ];
    return calls.flat().map((v) => (typeof v === "string" ? v : JSON.stringify(v))).join("\n");
  }

  it("masks top-level PII fields", () => {
    logger.info("test", {
      email: "guest@example.com",
      phone: "+64211234567",
      token: "eyJhbGciOiJIUzI1NiJ9.abc.def",
      password: "hunter2",
      ip: "192.168.1.1",
    });
    const out = allOutput();
    expect(out).not.toContain("guest@example.com");
    expect(out).not.toContain("+64211234567");
    expect(out).not.toContain("eyJhbGciOiJIUzI1NiJ9");
    expect(out).not.toContain("hunter2");
    expect(out).not.toContain("192.168.1.1");
    expect(out).toContain("[REDACTED");
  });

  it("masks nested PII fields", () => {
    logger.info("nested", {
      booking: {
        id: "bk_123",
        guest: { email: "a@b.co", firstName: "Alice" },
      },
    });
    const out = allOutput();
    expect(out).not.toContain("a@b.co");
    expect(out).not.toContain("Alice");
    expect(out).toContain("bk_123"); // non-PII passes through
  });

  it("masks PII in arrays", () => {
    logger.info("arr", { guests: [{ email: "x@y.z" }, { email: "p@q.r" }] });
    const out = allOutput();
    expect(out).not.toContain("x@y.z");
    expect(out).not.toContain("p@q.r");
  });

  it("recognises snake_case and kebab-case PII keys", () => {
    logger.info("casing", {
      email_address: "one@test.com",
      "phone-number": "123",
      API_KEY: "secretkey",
    });
    const out = allOutput();
    expect(out).not.toContain("one@test.com");
    expect(out).not.toContain("secretkey");
  });

  it("leaves non-PII context untouched", () => {
    logger.info("ok", { bookingId: "bk_42", amount: 635, property: "dome-pinot" });
    const out = allOutput();
    expect(out).toContain("bk_42");
    expect(out).toContain("635");
    expect(out).toContain("dome-pinot");
  });

  it("handles cycles and unusual objects without throwing", () => {
    const cyclic: Record<string, unknown> = { email: "loop@x.com" };
    cyclic.self = cyclic;
    expect(() => logger.info("cycle", cyclic)).not.toThrow();
    const out = allOutput();
    expect(out).not.toContain("loop@x.com");
  });
});

describe("scrub (direct)", () => {
  it("preserves structure for non-PII data", () => {
    const input = { a: 1, b: { c: [1, 2, 3] } };
    expect(scrub(input)).toEqual(input);
  });

  it("masks email at any depth", () => {
    const result = scrub({ u: { v: { email: "x@y.z" } } }) as { u: { v: { email: string } } };
    expect(result.u.v.email).not.toBe("x@y.z");
    expect(result.u.v.email).toMatch(/REDACTED/);
  });
});

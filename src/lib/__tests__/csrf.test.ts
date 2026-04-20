/**
 * Guards the CSRF token contract:
 *   1. Tokens are bound to the admin username — admin A's token cannot
 *      be validated against admin B.
 *   2. Tampered tokens are rejected.
 *   3. Tokens outside the 2h TTL are rejected.
 *   4. Valid tokens for the correct user pass.
 *
 * If any of these regress, a same-session replay attack or cross-admin
 * replay becomes possible. These tests must not use process.env mutation
 * at runtime — the module caches CSRF_SECRET at import, so we set the
 * env var once before importing.
 */
// Set the env var before any import of ../csrf is queued. `beforeAll` runs
// AFTER module-scope code, so setting it there raced the dynamic import
// below — Node 20 resolved the import microtask before beforeAll, leaving
// CSRF_SECRET undefined at module init and breaking token signing.
process.env.CSRF_SECRET = "test-secret-for-csrf-unit-tests";

import { describe, it, expect, vi } from "vitest";

const csrfModulePromise = import("../csrf");

describe("csrf", () => {
  it("generated token validates for the same username", async () => {
    const { generateCsrfToken, isValidCsrfToken } = await csrfModulePromise;
    const token = generateCsrfToken("admin");
    expect(isValidCsrfToken(token, "admin")).toBe(true);
  });

  it("rejects token validated against a different username", async () => {
    const { generateCsrfToken, isValidCsrfToken } = await csrfModulePromise;
    const token = generateCsrfToken("admin");
    expect(isValidCsrfToken(token, "attacker")).toBe(false);
  });

  it("rejects tampered signature", async () => {
    const { generateCsrfToken, isValidCsrfToken } = await csrfModulePromise;
    const token = generateCsrfToken("admin");
    const parts = token.split(":");
    parts[2] = parts[2].replace(/^./, (c) => (c === "a" ? "b" : "a"));
    const tampered = parts.join(":");
    expect(isValidCsrfToken(tampered, "admin")).toBe(false);
  });

  it("rejects tampered nonce", async () => {
    const { generateCsrfToken, isValidCsrfToken } = await csrfModulePromise;
    const token = generateCsrfToken("admin");
    const parts = token.split(":");
    parts[0] = "0".repeat(parts[0].length);
    expect(isValidCsrfToken(parts.join(":"), "admin")).toBe(false);
  });

  it("rejects tokens older than 2 hours", async () => {
    const { generateCsrfToken, isValidCsrfToken } = await csrfModulePromise;
    // Freeze time, generate token, advance past TTL.
    const realNow = Date.now;
    const t0 = realNow();
    vi.spyOn(Date, "now").mockReturnValue(t0);
    const token = generateCsrfToken("admin");
    vi.spyOn(Date, "now").mockReturnValue(t0 + 2 * 60 * 60 * 1000 + 1);
    expect(isValidCsrfToken(token, "admin")).toBe(false);
    vi.restoreAllMocks();
  });

  it("rejects malformed tokens", async () => {
    const { isValidCsrfToken } = await csrfModulePromise;
    expect(isValidCsrfToken("", "admin")).toBe(false);
    expect(isValidCsrfToken("only-one-segment", "admin")).toBe(false);
    expect(isValidCsrfToken("two:segments", "admin")).toBe(false);
    expect(isValidCsrfToken("four:parts:here:now", "admin")).toBe(false);
  });

  it("rejects empty username on validate", async () => {
    const { generateCsrfToken, isValidCsrfToken } = await csrfModulePromise;
    const token = generateCsrfToken("admin");
    expect(isValidCsrfToken(token, "")).toBe(false);
  });

  it("refuses to generate a token without a username", async () => {
    const { generateCsrfToken } = await csrfModulePromise;
    expect(() => generateCsrfToken("")).toThrow();
  });
});

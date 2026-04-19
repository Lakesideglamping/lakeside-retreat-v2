/**
 * Guards the auth token contract:
 *   1. createToken produces a JWT that verifyToken accepts.
 *   2. verifyToken returns the original username/role in the payload.
 *   3. Tokens with wrong issuer/audience are rejected.
 *   4. Blacklisted tokens are rejected.
 *   5. Tampered tokens are rejected.
 *
 * Prisma is mocked — these are pure token-logic tests; the DB path
 * (blacklist lookup + insert) is mocked shape-accurate.
 */
import { describe, it, expect, beforeAll, vi } from "vitest";

beforeAll(() => {
  process.env.JWT_SECRET = "test-jwt-secret-for-auth-unit-tests";
});

const blacklistStore = new Map<string, { expires_at: Date }>();

vi.mock("../db", () => ({
  prisma: {
    token_blacklist: {
      findUnique: vi.fn(async ({ where }: { where: { token_hash: string } }) => {
        return blacklistStore.get(where.token_hash) ?? null;
      }),
      upsert: vi.fn(async ({ where, create }: { where: { token_hash: string }; create: { token_hash: string; expires_at: Date } }) => {
        blacklistStore.set(where.token_hash, { expires_at: create.expires_at });
      }),
      deleteMany: vi.fn(async () => ({ count: 0 })),
    },
    system_settings: {
      findUnique: vi.fn(async () => null),
    },
  },
}));

const authModulePromise = import("../auth");

describe("auth.createToken + verifyToken", () => {
  it("round-trips username and role through JWT", async () => {
    const { createToken, verifyToken } = await authModulePromise;
    const token = await createToken("alice");
    const payload = await verifyToken(token);
    expect(payload).not.toBeNull();
    expect(payload?.username).toBe("alice");
    expect(payload?.role).toBe("admin");
  });

  it("rejects tokens signed with a different secret", async () => {
    const { verifyToken } = await authModulePromise;
    const { SignJWT } = await import("jose");
    const wrongSecret = new TextEncoder().encode("different-secret");
    const forged = await new SignJWT({ username: "mallory", role: "admin" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1h")
      .setIssuer("lakeside-retreat")
      .setAudience("admin-panel")
      .sign(wrongSecret);
    expect(await verifyToken(forged)).toBeNull();
  });

  it("rejects tokens with the wrong issuer", async () => {
    const { verifyToken } = await authModulePromise;
    const { SignJWT } = await import("jose");
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const forged = await new SignJWT({ username: "mallory", role: "admin" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1h")
      .setIssuer("evil.example.com")
      .setAudience("admin-panel")
      .sign(secret);
    expect(await verifyToken(forged)).toBeNull();
  });

  it("rejects tokens with the wrong audience", async () => {
    const { verifyToken } = await authModulePromise;
    const { SignJWT } = await import("jose");
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const forged = await new SignJWT({ username: "mallory", role: "admin" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1h")
      .setIssuer("lakeside-retreat")
      .setAudience("public")
      .sign(secret);
    expect(await verifyToken(forged)).toBeNull();
  });

  it("rejects tampered payloads", async () => {
    const { createToken, verifyToken } = await authModulePromise;
    const token = await createToken("alice");
    // Flip a character in the middle (payload) section.
    const parts = token.split(".");
    parts[1] = parts[1].slice(0, -3) + "AAA";
    expect(await verifyToken(parts.join("."))).toBeNull();
  });

  it("rejects blacklisted tokens even when otherwise valid", async () => {
    const { createToken, verifyToken, blacklistToken } = await authModulePromise;
    const token = await createToken("bob");
    expect(await verifyToken(token)).not.toBeNull();
    await blacklistToken(token);
    expect(await verifyToken(token)).toBeNull();
  });

  it("returns null for garbage input", async () => {
    const { verifyToken } = await authModulePromise;
    expect(await verifyToken("")).toBeNull();
    expect(await verifyToken("not.a.jwt")).toBeNull();
    expect(await verifyToken("a.b.c")).toBeNull();
  });
});

describe("auth.verifyPassword", () => {
  it("verifies matching password", async () => {
    const { verifyPassword } = await authModulePromise;
    const bcrypt = (await import("bcryptjs")).default;
    const hash = await bcrypt.hash("hunter2", 4); // low cost for test speed
    expect(await verifyPassword("hunter2", hash)).toBe(true);
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });
});

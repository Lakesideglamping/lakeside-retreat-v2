import { createHmac, timingSafeEqual, randomBytes } from "crypto";

const CSRF_SECRET = process.env.CSRF_SECRET ?? process.env.JWT_SECRET ?? "";

// Required in every environment — otherwise every mutation silently fails
// CSRF validation (or worse, validates against an empty key).
if (!CSRF_SECRET) {
  throw new Error("CSRF_SECRET (or JWT_SECRET fallback) must be set");
}

const TOKEN_TTL_MS = 2 * 60 * 60 * 1000;

/**
 * Generate a CSRF token bound to a specific admin username. Binding means
 * a token minted for admin A cannot be replayed by a compromised session
 * holding admin B's cookie — even if the token itself leaks. Verified
 * side must pass the same username from the authenticated JWT payload.
 */
export function generateCsrfToken(username: string): string {
  if (!username) throw new Error("generateCsrfToken requires a username");
  const nonce = randomBytes(32).toString("hex");
  const timestamp = Date.now().toString();
  const data = `${username}:${nonce}:${timestamp}`;
  const signature = createHmac("sha256", CSRF_SECRET)
    .update(data)
    .digest("hex");
  return `${nonce}:${timestamp}:${signature}`;
}

/**
 * Validate a CSRF token. The username MUST come from the verified JWT —
 * never from a request body or header — otherwise binding is defeated.
 */
export function isValidCsrfToken(token: string, username: string): boolean {
  if (!token || !username || !CSRF_SECRET) return false;

  const parts = token.split(":");
  if (parts.length !== 3) return false;

  const [nonce, timestamp, signature] = parts;

  const age = Date.now() - parseInt(timestamp, 10);
  if (isNaN(age) || age > TOKEN_TTL_MS || age < 0) return false;

  const data = `${username}:${nonce}:${timestamp}`;
  const expected = createHmac("sha256", CSRF_SECRET)
    .update(data)
    .digest("hex");

  try {
    const a = Buffer.from(signature, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

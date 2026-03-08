import { createHmac, timingSafeEqual, randomBytes } from "crypto";

const CSRF_SECRET = process.env.CSRF_SECRET ?? process.env.JWT_SECRET ?? "";

export function generateCsrfToken(): string {
  const nonce = randomBytes(32).toString("hex");
  const timestamp = Date.now().toString();
  const data = `${nonce}:${timestamp}`;
  const signature = createHmac("sha256", CSRF_SECRET)
    .update(data)
    .digest("hex");
  return `${data}:${signature}`;
}

export function isValidCsrfToken(token: string): boolean {
  if (!token || !CSRF_SECRET) return false;

  const parts = token.split(":");
  if (parts.length !== 3) return false;

  const [nonce, timestamp, signature] = parts;

  // Check token age (valid for 2 hours)
  const age = Date.now() - parseInt(timestamp, 10);
  if (isNaN(age) || age > 2 * 60 * 60 * 1000 || age < 0) return false;

  const data = `${nonce}:${timestamp}`;
  const expected = createHmac("sha256", CSRF_SECRET)
    .update(data)
    .digest("hex");

  try {
    return timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expected, "hex")
    );
  } catch {
    return false;
  }
}

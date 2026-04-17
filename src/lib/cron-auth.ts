import { timingSafeEqual } from "crypto";

export function verifyCronSecret(request: Request): boolean {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || !auth) return false;

  const expected = `Bearer ${secret}`;
  const authBuf = Buffer.from(auth);
  const expectedBuf = Buffer.from(expected);

  if (authBuf.length !== expectedBuf.length) return false;
  return timingSafeEqual(authBuf, expectedBuf);
}

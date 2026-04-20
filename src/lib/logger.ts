type LogLevel = "debug" | "info" | "warn" | "error";

// Edge Runtime has no `node:crypto`, so use the Web Crypto API which is
// available in Node 19+, Edge, and browsers. Fall back to a simple v4-shaped
// string for environments where it's somehow missing.
function randomUUID(): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (c?.randomUUID) return c.randomUUID();
  const hex = [...Array(16)].map(() => Math.floor(Math.random() * 256).toString(16).padStart(2, "0"));
  hex[6] = ((parseInt(hex[6], 16) & 0x0f) | 0x40).toString(16).padStart(2, "0");
  hex[8] = ((parseInt(hex[8], 16) & 0x3f) | 0x80).toString(16).padStart(2, "0");
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10, 16).join("")}`;
}

const LEVELS: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };

// Memoised at module load so we don't re-read the env var on every log call.
const MIN_LEVEL: number = (() => {
  const env = (process.env.LOG_LEVEL ?? "info") as LogLevel;
  return LEVELS[env] ?? 1;
})();

const IS_PROD = process.env.NODE_ENV === "production";

// ---- PII scrubbing ----------------------------------------------------------
// Centralised here so PII cannot reach stdout/Sentry no matter how a caller
// structures the context object. If you add a new PII-bearing field name
// anywhere in the codebase, add it to PII_KEYS (or a pattern below) — the
// accompanying tests double as the canonical list of what's scrubbed.

// Exact-match keys (normalised: lowercase, underscores/hyphens stripped).
const PII_KEYS = new Set([
  "email",
  "emailaddress",
  "guestemail",   // guest_email
  "phone",
  "phonenumber",
  "guestphone",   // guest_phone
  "mobile",
  "password",
  "passwordhash",
  "passwd",
  "token",
  "authtoken",
  "authorization",
  "cookie",
  "setcookie",
  "apikey",
  "secret",
  "ssn",
  "cardnumber",
  "cvv",
  "cvc",
  "dob",
  "dateofbirth",
  "ip",
  "ipaddress",
  "address",
  "streetaddress",
  "guestname",
  "firstname",
  "lastname",
  "fullname",
]);

// Substring patterns — a normalised key containing any of these is also PII.
// Catches prefixed variants like guest_email, billing_phone, user_address, etc.
const PII_SUBSTRINGS = ["email", "phone", "password", "secret", "token", "apikey", "cardnumber"];

function isPiiKey(normalised: string): boolean {
  if (PII_KEYS.has(normalised)) return true;
  return PII_SUBSTRINGS.some((s) => normalised.includes(s));
}

const MAX_DEPTH = 6;

function maskValue(value: unknown): string {
  if (typeof value !== "string") return "[REDACTED]";
  if (value.length === 0) return "";
  // Keep last 2 chars of short strings, last 4 of longer — enough to
  // correlate logs without exposing the value.
  const visible = value.length > 8 ? value.slice(-4) : value.length > 3 ? value.slice(-2) : "";
  return `[REDACTED${visible ? `…${visible}` : ""}]`;
}

/**
 * Recursively walk a log context and mask any PII fields by name. Safe to
 * call with any JSON-serialisable value; cycles and non-plain objects are
 * stringified rather than recursed into.
 */
export function scrub(input: unknown, depth = 0): unknown {
  if (depth > MAX_DEPTH) return "[MAX_DEPTH]";
  if (input === null || input === undefined) return input;
  if (Array.isArray(input)) return input.map((v) => scrub(v, depth + 1));
  if (typeof input !== "object") return input;

  // Only recurse into plain objects — not Error, Date, Buffer, etc.
  const proto = Object.getPrototypeOf(input);
  if (proto !== Object.prototype && proto !== null) {
    return String(input);
  }

  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    const normalised = key.toLowerCase().replace(/[_-]/g, "");
    if (isPiiKey(normalised)) {
      out[key] = maskValue(value);
    } else {
      out[key] = scrub(value, depth + 1);
    }
  }
  return out;
}

function log(
  level: LogLevel,
  message: string,
  context?: Record<string, unknown>,
  requestId?: string
) {
  if (LEVELS[level] < MIN_LEVEL) return;

  const scrubbed = context
    ? (scrub(context) as Record<string, unknown>)
    : undefined;

  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(requestId ? { requestId } : {}),
    ...scrubbed,
  };

  if (IS_PROD) {
    const method = level === "error" ? "error" : level === "warn" ? "warn" : "log";
    console[method](JSON.stringify(entry));
  } else {
    const colors: Record<LogLevel, string> = {
      debug: "\x1b[90m",
      info: "\x1b[36m",
      warn: "\x1b[33m",
      error: "\x1b[31m",
    };
    const reset = "\x1b[0m";
    const method = level === "error" ? "error" : level === "warn" ? "warn" : "log";
    console[method](
      `${colors[level]}[${level.toUpperCase()}]${reset} ${message}`,
      scrubbed ?? ""
    );
  }
}

export const logger = {
  debug: (msg: string, ctx?: Record<string, unknown>) => log("debug", msg, ctx),
  info: (msg: string, ctx?: Record<string, unknown>) => log("info", msg, ctx),
  warn: (msg: string, ctx?: Record<string, unknown>) => log("warn", msg, ctx),
  error: (msg: string, ctx?: Record<string, unknown>) => log("error", msg, ctx),

  /**
   * Create a child logger that stamps every entry with a shared requestId.
   * Use at the top of webhook/API route handlers so concurrent request logs
   * can be correlated in production output.
   *
   * Usage:
   *   const log = logger.withRequestId();
   *   log.info("checkout.session.completed", { sessionId });
   */
  withRequestId: (id?: string) => {
    const requestId = id ?? randomUUID();
    return {
      requestId,
      debug: (msg: string, ctx?: Record<string, unknown>) => log("debug", msg, ctx, requestId),
      info: (msg: string, ctx?: Record<string, unknown>) => log("info", msg, ctx, requestId),
      warn: (msg: string, ctx?: Record<string, unknown>) => log("warn", msg, ctx, requestId),
      error: (msg: string, ctx?: Record<string, unknown>) => log("error", msg, ctx, requestId),
    };
  },
};

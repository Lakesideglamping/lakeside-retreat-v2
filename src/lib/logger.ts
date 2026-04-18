import { randomUUID } from "crypto";

type LogLevel = "debug" | "info" | "warn" | "error";

const LEVELS: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };

// Memoised at module load so we don't re-read the env var on every log call.
const MIN_LEVEL: number = (() => {
  const env = (process.env.LOG_LEVEL ?? "info") as LogLevel;
  return LEVELS[env] ?? 1;
})();

const IS_PROD = process.env.NODE_ENV === "production";

function log(
  level: LogLevel,
  message: string,
  context?: Record<string, unknown>,
  requestId?: string
) {
  if (LEVELS[level] < MIN_LEVEL) return;

  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(requestId ? { requestId } : {}),
    ...context,
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
      context ?? ""
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

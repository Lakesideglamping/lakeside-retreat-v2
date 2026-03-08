type LogLevel = "debug" | "info" | "warn" | "error";

const LEVELS: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };

function getMinLevel(): number {
  const env = (process.env.LOG_LEVEL ?? "info") as LogLevel;
  return LEVELS[env] ?? 1;
}

function log(level: LogLevel, message: string, context?: Record<string, unknown>) {
  if (LEVELS[level] < getMinLevel()) return;

  const isProd = process.env.NODE_ENV === "production";
  const entry = { timestamp: new Date().toISOString(), level, message, ...context };

  if (isProd) {
    const method = level === "error" ? "error" : level === "warn" ? "warn" : "log";
    console[method](JSON.stringify(entry));
  } else {
    const colors: Record<LogLevel, string> = { debug: "\x1b[90m", info: "\x1b[36m", warn: "\x1b[33m", error: "\x1b[31m" };
    const reset = "\x1b[0m";
    const method = level === "error" ? "error" : level === "warn" ? "warn" : "log";
    console[method](`${colors[level]}[${level.toUpperCase()}]${reset} ${message}`, context ?? "");
  }
}

export const logger = {
  debug: (msg: string, ctx?: Record<string, unknown>) => log("debug", msg, ctx),
  info: (msg: string, ctx?: Record<string, unknown>) => log("info", msg, ctx),
  warn: (msg: string, ctx?: Record<string, unknown>) => log("warn", msg, ctx),
  error: (msg: string, ctx?: Record<string, unknown>) => log("error", msg, ctx),
};

/**
 * Refill the /_next/image cache every time the server process starts.
 *
 * Render has no persistent disk on our plan, so the optimised-image cache is
 * empty after every deploy, env-var change, plan change or crash restart. For
 * a month the refill was a manual ritual (`npm run warm:images`) that depended
 * on someone remembering; after the 3 Nov 2026 deploy nobody did, and Sentry's
 * weekly report put the image optimiser at a 22-second p95 — a dozen AVIF
 * encodes queueing behind each other for every first visitor to each page.
 *
 * Server startup is the one moment that is guaranteed to follow every one of
 * those events, so this runs the same script from there, against the
 * instance's own port. The script's own pacing (one request a second, abort
 * on a slow response) is what keeps a fresh instance from being swamped.
 *
 * Guards, each for a real way this could misfire:
 *   - Render only (`RENDER=true`, set on every Render service), unless forced
 *     with WARM_IMAGES_ON_START=true. Local `next start` and CI never warm.
 *   - Never during `next build`: static generation loads instrumentation too,
 *     and nothing is listening on PORT then anyway.
 *   - A health probe of the local port first: if the server isn't answering,
 *     skip rather than log 500 failures.
 *   - A lock file for this process's lifetime, so if the runtime ever loads
 *     instrumentation twice the script still runs once.
 *   - Delayed so the health check passes and traffic cuts over before any
 *     encode starts.
 */
import { spawn } from "node:child_process";
import { openSync, closeSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export const WARM_START_DELAY_MS = 20_000;
const LOCK_MAX_AGE_MS = 30 * 60 * 1000;

export interface WarmEnv {
  NODE_ENV?: string;
  RENDER?: string;
  NEXT_PHASE?: string;
  WARM_IMAGES_ON_START?: string;
  PORT?: string;
}

export interface WarmLogger {
  info: (message: string, meta?: Record<string, unknown>) => void;
  warn: (message: string, meta?: Record<string, unknown>) => void;
}

/** Decide, from the environment alone, whether this process should warm. */
export function shouldWarmOnStart(env: WarmEnv): boolean {
  if (env.WARM_IMAGES_ON_START === "false") return false;
  if (env.NEXT_PHASE === "phase-production-build") return false;
  if (env.WARM_IMAGES_ON_START === "true") return true;
  return env.NODE_ENV === "production" && env.RENDER === "true";
}

export function localBaseUrl(env: WarmEnv): string {
  return `http://127.0.0.1:${env.PORT || "3000"}`;
}

/**
 * Take a per-boot lock. Returns false if another warm has started in the last
 * 30 minutes. The lock lives in the OS temp dir, which on Render is wiped with
 * everything else on restart — exactly when a new warm should be allowed.
 */
export function acquireWarmLock(
  lockPath = join(tmpdir(), "lakeside-image-warm.lock")
): boolean {
  try {
    const age = Date.now() - statSync(lockPath).mtimeMs;
    if (age < LOCK_MAX_AGE_MS) return false;
  } catch {
    // no lock yet
  }
  try {
    closeSync(openSync(lockPath, "w"));
    return true;
  } catch {
    // Can't write a lock (read-only fs?). Warming twice is cheap; not warming
    // is the failure this file exists to prevent. Proceed.
    return true;
  }
}

export interface StartWarmOptions {
  env: WarmEnv;
  logger: WarmLogger;
  scriptPath: string;
  cwd: string;
  fetchImpl?: typeof fetch;
  spawnImpl?: typeof spawn;
  acquireLock?: () => boolean;
}

/**
 * Probe the local server, then run the warm script in the background. Resolves
 * once the script has been started (or skipped); never throws.
 */
export async function startImageWarm(
  opts: StartWarmOptions
): Promise<"started" | "skipped"> {
  const {
    env,
    logger,
    scriptPath,
    cwd,
    fetchImpl = fetch,
    spawnImpl = spawn,
    acquireLock = acquireWarmLock,
  } = opts;
  const base = localBaseUrl(env);

  try {
    const res = await fetchImpl(`${base}/api/health`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      logger.warn("[warm-images] local health check not ok — skipping warm", {
        status: res.status,
      });
      return "skipped";
    }
  } catch (err) {
    logger.warn("[warm-images] local server not answering — skipping warm", {
      error: err instanceof Error ? err.message : String(err),
    });
    return "skipped";
  }

  if (!acquireLock()) {
    logger.info("[warm-images] another warm started recently — skipping");
    return "skipped";
  }

  logger.info("[warm-images] starting image cache warm", { target: base });

  const child = spawnImpl(process.execPath, [scriptPath], {
    cwd,
    env: { ...process.env, BASE_URL: base },
    stdio: ["ignore", "pipe", "pipe"],
  });
  // Let the process exit normally even if the script is mid-run: on Render a
  // shutdown means a restart, and the next boot warms again.
  child.unref();

  const forward = (level: "info" | "warn") => (chunk: Buffer) => {
    for (const line of chunk.toString().split(/\r?\n/)) {
      if (line.trim()) logger[level](`[warm-images] ${line.trim()}`);
    }
  };
  child.stdout?.on("data", forward("info"));
  child.stderr?.on("data", forward("warn"));
  child.on("exit", (code) => {
    if (code === 0) logger.info("[warm-images] warm finished");
    else logger.warn("[warm-images] warm exited", { code });
  });
  child.on("error", (err) => {
    logger.warn("[warm-images] could not run warm script", { error: err.message });
  });

  return "started";
}

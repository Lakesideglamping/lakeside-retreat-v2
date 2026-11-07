import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");

    // Catch any promise rejection or exception that escapes all try/catch
    // blocks — fire-and-forget tasks, cron background work, third-party
    // callbacks. Edge runtime doesn't support process events, so this block
    // is Node.js only.
    const { logger } = await import("./lib/logger");

    process.on("unhandledRejection", (reason: unknown) => {
      logger.error("Unhandled promise rejection", {
        reason: reason instanceof Error ? reason.message : String(reason),
        stack: reason instanceof Error ? reason.stack : undefined,
      });
    });

    process.on("uncaughtException", (error: Error) => {
      logger.error("Uncaught exception", {
        error: error.message,
        stack: error.stack,
      });
      // Node.js exits after uncaughtException by default; we log it first
      // so Sentry/logger can flush before the process terminates.
    });

    // Refill the image cache after every start — see lib/warm-images-on-start.
    // Delayed so the health check passes and traffic cuts over first; unref'd
    // so a pending timer never holds the process open.
    const { shouldWarmOnStart, startImageWarm, WARM_START_DELAY_MS } = await import(
      "./lib/warm-images-on-start"
    );
    if (shouldWarmOnStart(process.env)) {
      const { join } = await import("node:path");
      const timer = setTimeout(() => {
        void startImageWarm({
          env: process.env,
          logger,
          scriptPath: join(process.cwd(), "scripts", "warm-image-cache.mjs"),
          cwd: process.cwd(),
        });
      }, WARM_START_DELAY_MS);
      timer.unref();
    }
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;

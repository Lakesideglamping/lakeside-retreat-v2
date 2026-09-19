import { prisma } from "./db";
import { stripe } from "./stripe";

/** How long any single dependency probe may take before it is called dead. */
const PROBE_TIMEOUT_MS = 3000;

/**
 * Bound the WAIT on a promise — not the work behind it.
 *
 * This is a race, so whatever it wraps keeps running after the timeout fires.
 * That is only acceptable where the work is internal and self-limiting, which
 * here means the Prisma ping and nothing else.
 *
 * Outbound HTTP must be cancelled properly instead — see AbortSignal.timeout
 * below. A request that only *appears* to time out while its socket stays open
 * is precisely how the Sentry tunnel took this service down: the hanging
 * sockets accumulated faster than they cleared, and slow pages became no pages
 * at all. The long tunnelRoute comment in next.config.ts is the full account.
 *
 * The timer is cleared on settle. Without that every call holds a live handle
 * for the full timeout even when the promise resolved immediately — which, at
 * the rate Render, UptimeRobot and Sentry poll this endpoint, is pure waste.
 */
function limitWait<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      timer = setTimeout(() => reject(new Error("timeout")), ms);
    }),
  ]).finally(() => clearTimeout(timer));
}

interface HealthStatus {
  status: "ok" | "degraded";
  timestamp: string;
  database: "connected" | "disconnected";
  services: {
    stripe: "ok" | "unconfigured" | "unreachable";
    email: boolean;
    uplisting: "ok" | "unconfigured" | "unreachable";
  };
}

/**
 * Probe every dependency and describe what it finds.
 *
 * This reports; it does not judge. Nothing here decides an HTTP status code —
 * that belongs to the route, and only /api/health/detail calls this at all.
 * /api/health is liveness and deliberately touches none of it, because a
 * third party being slow is not a reason to take this website off the air.
 */
export async function checkHealth(): Promise<HealthStatus> {
  // Run all checks concurrently — total latency = the slowest single probe.
  const [dbStatus, stripeStatus, uplistingStatus] = await Promise.all([
    // Database. limitWait is honest here: the query runs on a pooled
    // connection against our own Postgres and cannot hang indefinitely.
    limitWait(prisma.$queryRaw`SELECT 1`, PROBE_TIMEOUT_MS)
      .then(() => "connected" as const)
      .catch(() => "disconnected" as const),

    // Stripe — retrieving the balance is a lightweight authenticated ping.
    // The timeout goes to the SDK so it aborts the request itself, rather
    // than us walking away from a socket that is still open.
    (async () => {
      if (!stripe || !process.env.STRIPE_SECRET_KEY) return "unconfigured" as const;
      try {
        await stripe.balance.retrieve({}, { timeout: PROBE_TIMEOUT_MS });
        return "ok" as const;
      } catch {
        return "unreachable" as const;
      }
    })(),

    // Uplisting — AbortSignal.timeout actually cancels the fetch, closing the
    // socket. Racing a promise against a timer would not: the connection would
    // linger, once per poll, for as long as undici's default header timeout.
    (async () => {
      if (!process.env.UPLISTING_API_KEY) return "unconfigured" as const;
      try {
        const res = await fetch("https://app.uplisting.io/api/v1/properties", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${process.env.UPLISTING_API_KEY}`,
            Accept: "application/json",
          },
          signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
        });
        // 401 still proves the host answered, which is what is being tested.
        return res.ok || res.status === 401 ? ("ok" as const) : ("unreachable" as const);
      } catch {
        return "unreachable" as const;
      }
    })(),
  ]);

  const degraded =
    dbStatus === "disconnected" ||
    stripeStatus === "unreachable" ||
    uplistingStatus === "unreachable";

  return {
    status: degraded ? "degraded" : "ok",
    timestamp: new Date().toISOString(),
    database: dbStatus,
    services: {
      stripe: stripeStatus,
      email: !!process.env.EMAIL_USER && !!process.env.EMAIL_PASS,
      uplisting: uplistingStatus,
    },
  };
}

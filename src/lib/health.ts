import { prisma } from "./db";
import { stripe } from "./stripe";

// Wrap a promise with an abort-based timeout so health checks never hang.
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), ms)
    ),
  ]);
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

export async function checkHealth(): Promise<HealthStatus> {
  // Run all checks concurrently — total health check latency = slowest check.
  const [dbStatus, stripeStatus, uplistingStatus] = await Promise.all([
    // Database
    withTimeout(prisma.$queryRaw`SELECT 1`, 3000)
      .then(() => "connected" as const)
      .catch(() => "disconnected" as const),

    // Stripe — retrieve balance as a lightweight authenticated ping
    (async () => {
      if (!stripe || !process.env.STRIPE_SECRET_KEY) return "unconfigured" as const;
      try {
        await withTimeout(stripe.balance.retrieve(), 3000);
        return "ok" as const;
      } catch {
        return "unreachable" as const;
      }
    })(),

    // Uplisting — ping the properties endpoint with a short timeout
    (async () => {
      if (!process.env.UPLISTING_API_KEY) return "unconfigured" as const;
      try {
        const res = await withTimeout(
          fetch("https://app.uplisting.io/api/v1/properties", {
            method: "GET",
            headers: {
              Authorization: `Bearer ${process.env.UPLISTING_API_KEY}`,
              Accept: "application/json",
            },
          }),
          3000
        );
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

import { prisma } from "./db";

interface HealthStatus {
  status: "ok" | "degraded";
  timestamp: string;
  database: "connected" | "disconnected";
  services: {
    stripe: boolean;
    email: boolean;
    uplisting: boolean;
  };
}

export async function checkHealth(): Promise<HealthStatus> {
  let dbStatus: "connected" | "disconnected" = "disconnected";

  try {
    await prisma.$queryRawUnsafe("SELECT 1");
    dbStatus = "connected";
  } catch {
    // DB unreachable
  }

  return {
    status: dbStatus === "connected" ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    database: dbStatus,
    services: {
      stripe: !!process.env.STRIPE_SECRET_KEY,
      email: !!process.env.EMAIL_USER && !!process.env.EMAIL_PASS,
      uplisting: !!process.env.UPLISTING_API_KEY,
    },
  };
}

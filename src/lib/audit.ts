import { prisma } from "./db";

export async function auditLog(
  adminUser: string,
  action: string,
  details: Record<string, unknown>,
  ipAddress?: string
): Promise<void> {
  try {
    await prisma.audit_logs.create({
      data: {
        admin_user: adminUser,
        action,
        details: JSON.stringify(details),
        ip_address: ipAddress ?? null,
      },
    });
  } catch (error) {
    console.error("Failed to write audit log:", error);
  }
}

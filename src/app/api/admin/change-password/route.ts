import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { withAdminMutation, getClientIp } from "@/lib/admin-route";
import { auditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { verifyPassword, getAdminPasswordHash } from "@/lib/auth";
import { passwordChangeSchema } from "@/lib/admin-validations";

export async function POST(request: Request) {
  return withAdminMutation(request, async (admin) => {
    const body = await request.json();
    const parsed = passwordChangeSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      const firstError =
        Object.values(errors).flat()[0] ?? "Invalid input";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { currentPassword, newPassword } = parsed.data;

    // Verify current password
    const currentHash = await getAdminPasswordHash();
    const isValid = await verifyPassword(currentPassword, currentHash);

    if (!isValid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 }
      );
    }

    // Prevent reusing the same password
    const isSame = await verifyPassword(newPassword, currentHash);
    if (isSame) {
      return NextResponse.json(
        { error: "New password must be different from current password" },
        { status: 400 }
      );
    }

    // Hash and store the new password
    const newHash = await bcrypt.hash(newPassword, 12);

    await prisma.system_settings.upsert({
      where: { setting_key: "admin_password_hash" },
      update: { setting_value: newHash, updated_at: new Date() },
      create: {
        setting_key: "admin_password_hash",
        setting_value: newHash,
        setting_type: "string",
      },
    });

    await auditLog(
      admin.username,
      "password_changed",
      { message: "Admin password was changed" },
      getClientIp(request)
    );

    return NextResponse.json({ success: true });
  });
}

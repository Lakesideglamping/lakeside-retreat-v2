import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withAdmin, withAdminMutation, getClientIp } from "@/lib/admin-route";
import { contentUpdateSchema } from "@/lib/admin-validations";
import { auditLog } from "@/lib/audit";

export async function GET(request: Request) {
  return withAdmin(request, async () => {
    const settings = await prisma.system_settings.findMany({
      where: {
        setting_key: { startsWith: "content_" },
      },
      orderBy: { setting_key: "asc" },
    });

    const content: Record<string, string> = {};
    for (const setting of settings) {
      content[setting.setting_key] = setting.setting_value ?? "";
    }

    return NextResponse.json({ content });
  });
}

export async function PUT(request: Request) {
  return withAdminMutation(request, async (admin, req) => {
    const body = await req.json();
    const parsed = contentUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { sections } = parsed.data;
    const updatedKeys: string[] = [];

    for (const [key, value] of Object.entries(sections)) {
      // Only allow content_ prefixed keys
      if (!key.startsWith("content_")) continue;

      await prisma.system_settings.upsert({
        where: { setting_key: key },
        update: {
          setting_value: value,
          updated_at: new Date(),
        },
        create: {
          setting_key: key,
          setting_value: value,
          setting_type: "string",
        },
      });
      updatedKeys.push(key);
    }

    const ip = getClientIp(req);
    await auditLog(admin.username, "content_updated", {
      updatedKeys,
    }, ip);

    return NextResponse.json({ success: true, updatedKeys });
  });
}

import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/admin-route";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  return withAdmin(request, async () => {
    const setting = await prisma.system_settings.findUnique({
      where: { setting_key: "admin_2fa_enabled" },
    });

    const enabled = setting?.setting_value === "true";

    return NextResponse.json({ enabled });
  });
}

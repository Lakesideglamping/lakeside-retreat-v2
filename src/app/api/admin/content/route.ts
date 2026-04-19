import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withAdmin, withAdminMutation, getClientIp } from "@/lib/admin-route";
import { contentUpdateSchema } from "@/lib/admin-validations";
import { auditLog } from "@/lib/audit";

// Explicit whitelist of editable content keys. Mirrors the SECTIONS list in
// components/admin/content/content-editor.tsx. Keep in sync when adding new
// editable fields. Anything outside this set is silently ignored on write,
// which prevents the "any content_* key accepted" footgun and removes the
// stored-XSS surface if content is ever rendered unescaped.
const ALLOWED_CONTENT_KEYS = new Set<string>([
  "content_hero_title",
  "content_hero_subtitle",
  "content_hero_cta_text",
  "content_hero_cta_link",
  "content_about_title",
  "content_about_description",
  "content_about_highlight_1",
  "content_about_highlight_2",
  "content_about_highlight_3",
  "content_accommodations_title",
  "content_accommodations_description",
  "content_contact_title",
  "content_contact_description",
  "content_contact_email",
  "content_contact_phone",
  "content_contact_address",
  "content_seo_title",
  "content_seo_description",
  "content_seo_keywords",
  "content_seo_og_title",
  "content_seo_og_description",
]);

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
      if (!ALLOWED_CONTENT_KEYS.has(key)) continue;

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

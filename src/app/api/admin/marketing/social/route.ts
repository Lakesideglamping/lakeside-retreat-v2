import { NextResponse } from "next/server";
import { withAdmin, withAdminMutation, getClientIp } from "@/lib/admin-route";
import { auditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { z } from "zod";

const createSocialSchema = z.object({
  platform: z.string().min(1),
  source_type: z.string().optional(),
  source_text: z.string().optional(),
  accommodation: z.string().optional(),
  generated_caption: z.string().optional(),
  hashtags: z.string().optional(),
  story_text: z.string().optional(),
});

export async function GET(request: Request) {
  return withAdmin(request, async () => {
    const drafts = await prisma.social_content_drafts.findMany({
      orderBy: { id: "desc" },
    });

    return NextResponse.json({ drafts });
  });
}

export async function POST(request: Request) {
  return withAdminMutation(request, async (admin) => {
    const body = await request.json();
    const parsed = createSocialSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const draft = await prisma.social_content_drafts.create({
      data: {
        platform: parsed.data.platform,
        source_type: parsed.data.source_type ?? null,
        source_text: parsed.data.source_text ?? null,
        accommodation: parsed.data.accommodation ?? null,
        generated_caption: parsed.data.generated_caption ?? null,
        hashtags: parsed.data.hashtags ?? null,
        story_text: parsed.data.story_text ?? null,
        status: "draft",
      },
    });

    await auditLog(
      admin.username,
      "social_draft_created",
      { draftId: draft.id, platform: draft.platform },
      getClientIp(request)
    );

    return NextResponse.json({ success: true, draft }, { status: 201 });
  });
}

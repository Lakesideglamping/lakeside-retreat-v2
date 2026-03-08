import { NextResponse } from "next/server";
import { withAdminMutation, getClientIp } from "@/lib/admin-route";
import { auditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { z } from "zod";

const updateSocialSchema = z.object({
  status: z.enum(["draft", "published", "archived"]).optional(),
  generated_caption: z.string().optional(),
  hashtags: z.string().optional(),
  story_text: z.string().optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminMutation(request, async (admin) => {
    const { id } = await params;
    const draftId = parseInt(id, 10);

    if (isNaN(draftId)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const existing = await prisma.social_content_drafts.findUnique({
      where: { id: draftId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Social draft not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parsed = updateSocialSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updated = await prisma.social_content_drafts.update({
      where: { id: draftId },
      data: {
        ...(parsed.data.status !== undefined && { status: parsed.data.status }),
        ...(parsed.data.generated_caption !== undefined && {
          generated_caption: parsed.data.generated_caption,
        }),
        ...(parsed.data.hashtags !== undefined && {
          hashtags: parsed.data.hashtags,
        }),
        ...(parsed.data.story_text !== undefined && {
          story_text: parsed.data.story_text,
        }),
      },
    });

    await auditLog(
      admin.username,
      "social_draft_updated",
      { draftId, changes: parsed.data },
      getClientIp(request)
    );

    return NextResponse.json({ success: true, draft: updated });
  });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withAdminMutation, getClientIp } from "@/lib/admin-route";
import { reviewUpdateSchema } from "@/lib/admin-validations";
import { auditLog } from "@/lib/audit";

type RouteParams = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: RouteParams) {
  return withAdminMutation(request, async (admin, req) => {
    const { id } = await params;
    const reviewId = parseInt(id, 10);

    if (isNaN(reviewId)) {
      return NextResponse.json({ error: "Invalid review ID" }, { status: 400 });
    }

    const review = await prisma.reviews.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = reviewUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const updateData: Record<string, unknown> = {
      updated_at: new Date(),
    };

    if (data.status !== undefined) updateData.status = data.status;
    if (data.is_featured !== undefined) updateData.is_featured = data.is_featured;
    if (data.admin_notes !== undefined) updateData.admin_notes = data.admin_notes;
    if (data.admin_response !== undefined) {
      updateData.admin_response = data.admin_response;
      updateData.response_date = new Date();
    }

    const updated = await prisma.reviews.update({
      where: { id: reviewId },
      data: updateData,
    });

    const ip = getClientIp(req);
    await auditLog(admin.username, "review_updated", {
      reviewId,
      changes: data,
    }, ip);

    return NextResponse.json(updated);
  });
}

export async function DELETE(request: Request, { params }: RouteParams) {
  return withAdminMutation(request, async (admin, req) => {
    const { id } = await params;
    const reviewId = parseInt(id, 10);

    if (isNaN(reviewId)) {
      return NextResponse.json({ error: "Invalid review ID" }, { status: 400 });
    }

    const review = await prisma.reviews.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    await prisma.reviews.delete({
      where: { id: reviewId },
    });

    const ip = getClientIp(req);
    await auditLog(admin.username, "review_deleted", {
      reviewId,
      guestName: review.guest_name,
    }, ip);

    return NextResponse.json({ success: true });
  });
}

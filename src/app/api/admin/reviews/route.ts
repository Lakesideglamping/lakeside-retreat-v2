import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withAdmin, withAdminMutation, getClientIp } from "@/lib/admin-route";
import { reviewSchema } from "@/lib/admin-validations";
import { auditLog } from "@/lib/audit";
import type { Prisma } from "@/generated/prisma/client";

export async function GET(request: Request) {
  return withAdmin(request, async (_admin, req) => {
    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "20", 10)));
    const status = url.searchParams.get("status");
    const platform = url.searchParams.get("platform");
    const property = url.searchParams.get("property");
    const search = url.searchParams.get("search");

    const where: Prisma.reviewsWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (platform) {
      where.platform = platform;
    }

    if (property) {
      where.property = property;
    }

    if (search) {
      where.OR = [
        { guest_name: { contains: search, mode: "insensitive" } },
        { review_text: { contains: search, mode: "insensitive" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      prisma.reviews.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
      }),
      prisma.reviews.count({ where }),
    ]);

    return NextResponse.json({
      reviews,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  });
}

export async function POST(request: Request) {
  return withAdminMutation(request, async (admin, req) => {
    const body = await req.json();
    const parsed = reviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const review = await prisma.reviews.create({
      data: {
        guest_name: data.guest_name,
        platform: data.platform ?? "direct",
        rating: data.rating,
        review_text: data.review_text ?? null,
        stay_date: data.stay_date ? new Date(data.stay_date) : null,
        property: data.property ?? null,
        status: data.status ?? "approved",
        is_featured: data.is_featured ?? false,
        admin_notes: data.admin_notes ?? null,
        admin_response: data.admin_response ?? null,
      },
    });

    const ip = getClientIp(req);
    await auditLog(admin.username, "review_created", {
      reviewId: review.id,
      guestName: review.guest_name,
      platform: review.platform,
      rating: review.rating,
    }, ip);

    return NextResponse.json(review, { status: 201 });
  });
}

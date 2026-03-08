import { NextResponse } from "next/server";
import { withAdminMutation, getClientIp } from "@/lib/admin-route";
import { auditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  return withAdminMutation(request, async (admin) => {
    const { bookingId } = await params;

    const reviewRequest = await prisma.review_requests.findUnique({
      where: { booking_id: bookingId },
    });

    if (!reviewRequest) {
      return NextResponse.json(
        { error: "Review request not found" },
        { status: 404 }
      );
    }

    const updated = await prisma.review_requests.update({
      where: { booking_id: bookingId },
      data: {
        request_count: (reviewRequest.request_count ?? 0) + 1,
        last_request_sent_at: new Date().toISOString(),
        status: "sent",
      },
    });

    await auditLog(
      admin.username,
      "review_request_sent",
      { bookingId, requestCount: updated.request_count },
      getClientIp(request)
    );

    return NextResponse.json({ success: true, request: updated });
  });
}

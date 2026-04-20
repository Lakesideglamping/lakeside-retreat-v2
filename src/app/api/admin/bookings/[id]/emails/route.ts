import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withAdmin } from "@/lib/admin-route";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteParams) {
  return withAdmin(request, async () => {
    const { id } = await params;

    const sends = await prisma.email_sends.findMany({
      where: { booking_id: id },
      orderBy: { sent_at: "desc" },
      take: 50,
    });

    return NextResponse.json({
      emails: sends.map((s) => ({
        id: s.id,
        template: s.template,
        recipient: s.recipient,
        subject: s.subject,
        status: s.status,
        error: s.error,
        sent_at: s.sent_at.toISOString(),
      })),
    });
  });
}

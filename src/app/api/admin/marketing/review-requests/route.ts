import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/admin-route";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  return withAdmin(request, async () => {
    const requests = await prisma.review_requests.findMany({
      orderBy: { id: "desc" },
    });

    return NextResponse.json({ requests });
  });
}

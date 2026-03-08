import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/admin-route";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  return withAdmin(request, async () => {
    const checkouts = await prisma.abandoned_checkout_reminders.findMany({
      orderBy: { id: "desc" },
    });

    return NextResponse.json({ checkouts });
  });
}

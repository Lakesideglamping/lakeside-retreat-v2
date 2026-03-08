import { NextResponse } from "next/server";
import { withAdminMutation } from "@/lib/admin-route";
import { testEmailConfiguration } from "@/lib/email";

export async function POST(request: Request) {
  return withAdminMutation(request, async () => {
    const result = await testEmailConfiguration();
    return NextResponse.json(result);
  });
}

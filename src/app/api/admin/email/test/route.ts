import { NextResponse } from "next/server";
import { withAdminMutation, getClientIp } from "@/lib/admin-route";
import { testEmailConfiguration } from "@/lib/email";
import { auditLog } from "@/lib/audit";

export async function POST(request: Request) {
  return withAdminMutation(request, async (admin, req) => {
    const result = await testEmailConfiguration();

    await auditLog(
      admin.username,
      "email_test_performed",
      { success: result.success, message: result.message },
      getClientIp(req)
    );

    return NextResponse.json(result);
  });
}

import { NextResponse } from "next/server";
import { generateCsrfToken } from "@/lib/csrf";
import { withAdmin } from "@/lib/admin-route";

export async function GET(request: Request) {
  return withAdmin(request, async () => {
    const token = generateCsrfToken();
    return NextResponse.json({ token });
  });
}

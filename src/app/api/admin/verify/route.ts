import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json({ valid: false }, { status: 401 });
  }

  const admin = await verifyToken(token);

  if (!admin) {
    return NextResponse.json({ valid: false }, { status: 401 });
  }

  // Deliberately return only {valid:true} — no username/role echo. This
  // endpoint is reachable by any authenticated session, and there's no
  // reason to expose identity info to code paths that don't already know.
  return NextResponse.json({ valid: true });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { withAdminMutation, getClientIp } from "@/lib/admin-route";
import { auditLog } from "@/lib/audit";
import { logger } from "@/lib/logger";

const API_BASE = "https://connect.uplisting.io";

const PROPERTY_IDS: Record<string, string | undefined> = {
  "dome-pinot": process.env.UPLISTING_PINOT_ID,
  "dome-rose": process.env.UPLISTING_ROSE_ID,
  "lakeside-cottage": process.env.UPLISTING_COTTAGE_ID,
};

const unblockSchema = z.object({
  accommodation: z.enum(["dome-pinot", "dome-rose", "lakeside-cottage"]),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "from must be YYYY-MM-DD"),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "to must be YYYY-MM-DD"),
  available: z.boolean().optional(),
  reason: z.string().max(500).optional(),
});

function authHeader(): string {
  const key = process.env.UPLISTING_API_KEY;
  if (!key) return "";
  return `Basic ${Buffer.from(key).toString("base64")}`;
}

// POST: block or unblock dates, optionally with a note. Admin-only.
export async function POST(request: Request) {
  return withAdminMutation(request, async (admin, req) => {
    if (!process.env.UPLISTING_API_KEY) {
      return NextResponse.json(
        { error: "Uplisting not configured" },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => null);
    const parsed = unblockSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { accommodation, from, to, available = true, reason } = parsed.data;

    const propertyId = PROPERTY_IDS[accommodation];
    if (!propertyId) {
      return NextResponse.json(
        { error: "Unknown accommodation" },
        { status: 400 }
      );
    }

    const day: Record<string, unknown> = { available, from, to };
    if (reason) day.reason = reason;

    const res = await fetch(`${API_BASE}/calendar/${propertyId}`, {
      method: "POST",
      headers: {
        Authorization: authHeader(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ calendar: { days: [day] } }),
    });

    const responseText = await res.text();
    if (!res.ok) {
      logger.error("[uplisting-unblock] Failed", {
        status: res.status,
        accommodation,
        from,
        to,
        responseText,
      });
      return NextResponse.json(
        { error: "Uplisting request failed" },
        { status: 502 }
      );
    }

    const ip = getClientIp(req);
    await auditLog(
      admin.username,
      available ? "calendar_unblocked" : "calendar_blocked",
      { accommodation, from, to, reason },
      ip
    );

    return NextResponse.json({
      success: true,
      accommodation,
      from,
      to,
      available,
      reason,
    });
  });
}

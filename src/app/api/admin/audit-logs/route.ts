import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/admin-route";
import { prisma } from "@/lib/db";

// audit_logs.action values written by the codebase. Anything else is ignored
// so a hijacked session can't enumerate arbitrary action strings.
const VALID_AUDIT_ACTIONS = new Set([
  "login_success",
  "login_failed",
  "logout",
  "2fa_enabled",
  "2fa_disabled",
  "2fa_failed",
  "2fa_recovery_used",
  "2fa_recovery_regenerated",
  "booking_created",
  "booking_updated",
  "booking_deleted",
  "booking_status_updated",
  "booking_refunded",
  "booking_sync_attempted",
  "booking_synced",
  "booking_sync_failed",
  "bookings_imported",
  "blocked_date_created",
  "blocked_date_deleted",
  "seasonal_rate_created",
  "seasonal_rate_updated",
  "seasonal_rate_deleted",
  "promo_code_created",
  "promo_code_updated",
  "promo_code_deleted",
  "promo_code_status_changed",
  "review_created",
  "review_updated",
  "review_deleted",
  "review_bulk",
  "deposit_released",
  "deposit_claimed",
]);

const UUID_SHAPE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: Request) {
  return withAdmin(request, async () => {
    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get("bookingId");
    const action = searchParams.get("action");
    const limit = Math.min(Number(searchParams.get("limit") ?? 50), 200);
    const offset = Math.max(Number(searchParams.get("offset") ?? 0), 0);

    // audit_logs.details is a JSON-encoded string; filtering on a nested key
    // inside it is done with a substring match against the stringified payload.
    // UUID-shape the bookingId first — a raw substring match on untrusted
    // input against a JSON blob is both wasteful and a minor info-leak vector.
    const where: Record<string, unknown> = {};
    if (action && VALID_AUDIT_ACTIONS.has(action)) where.action = action;
    if (bookingId && UUID_SHAPE.test(bookingId)) {
      where.details = { contains: bookingId };
    }

    const [rows, total] = await Promise.all([
      prisma.audit_logs.findMany({
        where,
        orderBy: { created_at: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.audit_logs.count({ where }),
    ]);

    const logs = rows.map((r) => {
      let parsed: unknown = null;
      try {
        parsed = r.details ? JSON.parse(r.details) : null;
      } catch {
        parsed = r.details;
      }
      return {
        id: r.id,
        admin_user: r.admin_user,
        action: r.action,
        details: parsed,
        ip_address: r.ip_address,
        created_at: r.created_at,
      };
    });

    return NextResponse.json({ logs, total, limit, offset });
  });
}

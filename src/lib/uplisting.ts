import { getCached, setCache } from "./cache";
import crypto from "crypto";

const API_BASE = "https://connect.uplisting.io";
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const PROPERTY_IDS: Record<string, string | undefined> = {
  "dome-pinot": process.env.UPLISTING_PINOT_ID,
  "dome-rose": process.env.UPLISTING_ROSE_ID,
  "lakeside-cottage": process.env.UPLISTING_COTTAGE_ID,
};

function authHeader(): string {
  const key = process.env.UPLISTING_API_KEY;
  if (!key) return "";
  return `Basic ${Buffer.from(key).toString("base64")}`;
}

export function isConfigured(): boolean {
  return !!process.env.UPLISTING_API_KEY;
}

// In non-production environments (local `next dev`), treat writes to Uplisting
// as a no-op so test bookings can't create real reservations in the live PMS.
// Reads stay enabled so the booking UI behaves realistically in dev.
const isLocalEnv = process.env.NODE_ENV !== "production";

/**
 * Format a Date as YYYY-MM-DD in the Pacific/Auckland timezone.
 * Using `toISOString().split("T")[0]` converts to UTC first — for a NZ-based
 * business on a server running UTC, that can be off by one day.
 */
export function nzDateString(date: Date = new Date()): string {
  // en-CA gives ISO-style YYYY-MM-DD output.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Pacific/Auckland",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries: number = 3
): Promise<Response> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (res.ok) return res;

      // Retry on 429 (rate limit) and 5xx (server error).
      // Respect Retry-After header when Uplisting sends one.
      if (res.status === 429 || res.status >= 500) {
        lastError = new Error(`Uplisting API error: ${res.status}`);
        const retryAfterHeader = res.headers.get("retry-after");
        const retryAfterMs =
          retryAfterHeader && !Number.isNaN(Number(retryAfterHeader))
            ? Number(retryAfterHeader) * 1000
            : Math.pow(2, attempt) * 1000;
        if (attempt < maxRetries - 1) {
          await new Promise((r) => setTimeout(r, retryAfterMs));
          continue;
        }
        return res; // give up after maxRetries, return the last response
      }

      // 4xx (non-429) — no point retrying
      return res;
    } catch (err) {
      lastError = err as Error;
      if (attempt < maxRetries - 1) {
        await new Promise((r) =>
          setTimeout(r, Math.pow(2, attempt) * 1000)
        );
      }
    }
  }
  throw lastError || new Error("Uplisting API request failed");
}

export async function fetchBlockedDates(
  accommodation: string
): Promise<string[]> {
  if (!isConfigured()) return [];

  const cacheKey = `blocked-dates-${accommodation}`;
  const cached = getCached<string[]>(cacheKey, CACHE_TTL);
  if (cached) return cached;

  const propertyId = PROPERTY_IDS[accommodation];
  if (!propertyId) return [];

  try {
    // Calendar range: today → today + 1 year, in NZ local time.
    const today = nzDateString();
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const toDate = nzDateString(futureDate);

    const res = await fetchWithRetry(
      `${API_BASE}/calendar/${propertyId}?from=${today}&to=${toDate}`,
      {
        headers: {
          Authorization: authHeader(),
          "Content-Type": "application/json",
        },
      }
    );

    if (!res.ok) {
      console.error(`[uplisting] Failed to fetch calendar: ${res.status}`);
      return [];
    }

    const data = await res.json();
    const blocked: string[] = [];

    for (const day of data.calendar?.days || []) {
      if (!day.available) {
        blocked.push(day.date);
      }
    }

    setCache(cacheKey, blocked);
    return blocked;
  } catch (err) {
    console.error("[uplisting] Error fetching blocked dates:", err);
    return [];
  }
}

export async function checkAvailability(
  accommodation: string,
  checkIn: string,
  checkOut: string
): Promise<boolean> {
  if (!isConfigured()) return true; // fail-open in dev

  const blocked = await fetchBlockedDates(accommodation);
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const current = new Date(start);

  while (current < end) {
    const dateStr = nzDateString(current);
    if (blocked.includes(dateStr)) return false;
    current.setDate(current.getDate() + 1);
  }

  return true;
}

interface SyncBookingData {
  accommodation: string;
  checkIn: string;
  checkOut: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  guests: number;
  totalPrice?: number;
}

/**
 * Create a reservation in Uplisting when a direct website booking is made.
 * Throws on failure — the caller is responsible for handling (alerting,
 * marking sync_status=failed, etc). The previous silent calendar-block
 * fallback was removed because it masked real failures: OTAs could still see
 * dates as "unavailable" but no actual guest record existed in Uplisting.
 */
export async function syncBooking(data: SyncBookingData): Promise<void> {
  if (isLocalEnv) {
    console.log("[uplisting] Local/dev env — skipping booking sync.", data);
    return;
  }
  if (!isConfigured()) {
    console.log("[uplisting] Not configured — skipping booking sync.", data);
    return;
  }

  const propertyId = PROPERTY_IDS[data.accommodation];
  if (!propertyId) {
    throw new Error(`No Uplisting property ID for ${data.accommodation}`);
  }

  // Split full name into first/last for the API
  const nameParts = data.guestName.trim().split(" ");
  const firstName = nameParts[0] || data.guestName;
  const lastName = nameParts.slice(1).join(" ") || "-";

  // Deterministic idempotency key — retries of the same booking won't create
  // duplicate reservations in Uplisting.
  const idempotencyKey = crypto
    .createHash("sha256")
    .update(
      `${propertyId}|${data.checkIn}|${data.checkOut}|${data.guestEmail}`
    )
    .digest("hex");

  const res = await fetchWithRetry(`${API_BASE}/reservations`, {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({
      reservation: {
        property_id: propertyId,
        check_in: data.checkIn,
        check_out: data.checkOut,
        adults: data.guests,
        children: 0,
        source: "direct",
        guest_first_name: firstName,
        guest_last_name: lastName,
        guest_email: data.guestEmail,
        guest_phone: data.guestPhone || "",
        total_price: data.totalPrice ?? 0,
        currency: "NZD",
        notes: "Booked via Lakeside Retreat website",
      },
    }),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new Error(
      `Uplisting reservation creation failed (${res.status}): ${errBody.slice(0, 500)}`
    );
  }

  const body = await res.json().catch(() => ({}));
  console.log(
    `[uplisting] Reservation created for ${data.guestName} (${data.checkIn} → ${data.checkOut})`,
    body
  );
  // Invalidate blocked-dates cache so the new reservation appears immediately.
  setCache(`blocked-dates-${data.accommodation}`, null);
}

export function verifyWebhookSignature(
  rawBody: string,
  signature: string
): boolean {
  const secret = process.env.UPLISTING_WEBHOOK_SECRET;
  if (!secret) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length) return false;
  return crypto.timingSafeEqual(sigBuf, expBuf);
}

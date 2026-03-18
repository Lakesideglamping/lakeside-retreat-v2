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
      if (res.status >= 500) {
        lastError = new Error(`Uplisting API error: ${res.status}`);
        await new Promise((r) =>
          setTimeout(r, Math.pow(2, attempt) * 1000)
        );
        continue;
      }
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
    // Use calendar endpoint for availability — more efficient than bookings
    const today = new Date().toISOString().split("T")[0];
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);
    const toDate = futureDate.toISOString().split("T")[0];

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
    const dateStr = current.toISOString().split("T")[0];
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
 * Uses the reservations API so it appears as a proper booking (not just "unavailable").
 * Falls back to calendar blocking if the reservations endpoint fails.
 */
export async function syncBooking(data: SyncBookingData): Promise<void> {
  if (!isConfigured()) {
    console.log("[uplisting] Not configured — skipping booking sync.", data);
    return;
  }

  const propertyId = PROPERTY_IDS[data.accommodation];
  if (!propertyId) {
    console.error(`[uplisting] No property ID for ${data.accommodation}`);
    return;
  }

  // Split full name into first/last for the API
  const nameParts = data.guestName.trim().split(" ");
  const firstName = nameParts[0] || data.guestName;
  const lastName = nameParts.slice(1).join(" ") || "-";

  // Try to create a proper reservation so it shows as a booking in Uplisting
  try {
    const res = await fetchWithRetry(
      `${API_BASE}/reservations`,
      {
        method: "POST",
        headers: {
          Authorization: authHeader(),
          "Content-Type": "application/json",
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
      }
    );

    if (res.ok) {
      const body = await res.json().catch(() => ({}));
      console.log(
        `[uplisting] Reservation created for ${data.guestName} (${data.checkIn} → ${data.checkOut})`,
        body
      );
      setCache(`blocked-dates-${data.accommodation}`, null);
      return;
    }

    const errBody = await res.text();
    console.warn(
      `[uplisting] Reservation creation failed (${res.status}), falling back to calendar block:`,
      errBody
    );
  } catch (err) {
    console.warn("[uplisting] Reservation API error, falling back to calendar block:", err);
  }

  // Fallback: block dates on calendar so at minimum the dates are unavailable
  try {
    const res = await fetchWithRetry(
      `${API_BASE}/calendar/${propertyId}`,
      {
        method: "POST",
        headers: {
          Authorization: authHeader(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          calendar: {
            days: [{ available: false, from: data.checkIn, to: data.checkOut }],
          },
        }),
      }
    );

    if (!res.ok) {
      const body = await res.text();
      console.error(`[uplisting] Calendar fallback also failed: ${res.status}`, body);
    } else {
      console.log(
        `[uplisting] Fallback: blocked dates ${data.checkIn} to ${data.checkOut} for ${data.accommodation}`
      );
    }
  } catch (err) {
    console.error("[uplisting] Calendar fallback error:", err);
  }

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

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

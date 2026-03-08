import { getCached, setCache } from "./cache";

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
    const res = await fetchWithRetry(
      `${API_BASE}/api/v2/properties/${propertyId}/bookings`,
      {
        headers: {
          Authorization: authHeader(),
          Accept: "application/json",
        },
      }
    );

    if (!res.ok) {
      console.error(`[uplisting] Failed to fetch blocked dates: ${res.status}`);
      return [];
    }

    const data = await res.json();
    const blocked: string[] = [];

    for (const booking of data.data || []) {
      const start = new Date(booking.attributes?.check_in || booking.check_in);
      const end = new Date(booking.attributes?.check_out || booking.check_out);
      const current = new Date(start);
      while (current < end) {
        blocked.push(current.toISOString().split("T")[0]);
        current.setDate(current.getDate() + 1);
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
}

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

  const [firstName, ...lastParts] = data.guestName.split(" ");
  const lastName = lastParts.join(" ") || firstName;

  try {
    const res = await fetchWithRetry(`${API_BASE}/api/v2/bookings`, {
      method: "POST",
      headers: {
        Authorization: authHeader(),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        data: {
          type: "bookings",
          attributes: {
            property_id: propertyId,
            check_in: data.checkIn,
            check_out: data.checkOut,
            guest_first_name: firstName,
            guest_last_name: lastName,
            guest_email: data.guestEmail,
            guest_phone: data.guestPhone || "",
            number_of_guests: data.guests,
            source: "direct",
          },
        },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error(`[uplisting] Booking sync failed: ${res.status}`, body);
    }
  } catch (err) {
    console.error("[uplisting] Booking sync error:", err);
  }
}

export function verifyWebhookSignature(
  rawBody: string,
  signature: string
): boolean {
  const secret = process.env.UPLISTING_WEBHOOK_SECRET;
  if (!secret) return false;

  const crypto = require("crypto") as typeof import("crypto");
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

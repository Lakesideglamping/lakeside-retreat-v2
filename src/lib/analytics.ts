/**
 * Visitor analytics: Umami (visitor counts) and the Meta (Facebook/Instagram)
 * Pixel (ad measurement).
 *
 * Both are off unless configured, so a deploy without the variables ships no
 * third-party tracking at all:
 *
 *   UMAMI_WEBSITE_ID  the website's UUID (Umami → Settings → Websites → Edit)
 *   UMAMI_SCRIPT_URL  optional; defaults to Umami Cloud. Set it to
 *                     https://<your-host>/script.js for a self-hosted Umami.
 *   META_PIXEL_ID     e.g. 123456789012345 (Meta Events Manager)
 *
 * They are read at request time by a server component (and by middleware for
 * the CSP), not baked in at build like NEXT_PUBLIC_* variables, so changing
 * one on Render takes effect on the next restart without a rebuild.
 *
 * Each value ends up in an HTML attribute, an inline <script> body or the CSP
 * header, so it is checked against its exact format first. Anything else is
 * treated as unset rather than escaped — a malformed value would not track
 * anything anyway.
 */

const UMAMI_CLOUD_SCRIPT_URL = "https://cloud.umami.is/script.js";
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const META_PIXEL_ID_PATTERN = /^\d{6,20}$/;

// Umami Cloud serves the script from cloud.umami.is but its tracker posts
// events to a separate collection host, gateway.umami.is (seen in a CSP
// violation on the live site). api-gateway.umami.dev is an older collection
// host, kept in case the cloud script falls back to it.
const UMAMI_CLOUD_CONNECT_ORIGINS = [
  "https://cloud.umami.is",
  "https://gateway.umami.is",
  "https://api-gateway.umami.dev",
];

export interface UmamiConfig {
  websiteId: string;
  scriptUrl: string;
}

export interface AnalyticsConfig {
  umami: UmamiConfig | null;
  metaPixelId: string | null;
}

/** An https URL to a .js file, with no query, fragment or credentials. */
function parseScriptUrl(raw: string | undefined): string | null {
  if (!raw?.trim()) return UMAMI_CLOUD_SCRIPT_URL;
  try {
    const url = new URL(raw.trim());
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      !url.pathname.endsWith(".js")
    ) {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

export function getAnalyticsConfig(
  env: Record<string, string | undefined> = process.env
): AnalyticsConfig {
  const websiteId = env.UMAMI_WEBSITE_ID?.trim().toLowerCase();
  const scriptUrl = parseScriptUrl(env.UMAMI_SCRIPT_URL);
  const meta = env.META_PIXEL_ID?.trim();
  return {
    umami:
      websiteId && UUID_PATTERN.test(websiteId) && scriptUrl
        ? { websiteId, scriptUrl }
        : null,
    metaPixelId: meta && META_PIXEL_ID_PATTERN.test(meta) ? meta : null,
  };
}

/**
 * Origins the Umami tracker sends events to, for CSP connect-src. A
 * self-hosted tracker posts back to its own origin.
 */
export function umamiConnectOrigins(umami: UmamiConfig | null): string[] {
  if (!umami) return [];
  if (umami.scriptUrl === UMAMI_CLOUD_SCRIPT_URL) {
    return UMAMI_CLOUD_CONNECT_ORIGINS;
  }
  return [new URL(umami.scriptUrl).origin];
}

/**
 * Only the live domain is counted, so local development, Render preview URLs
 * and anyone copying the page do not inflate the numbers.
 */
export const UMAMI_TRACKED_DOMAINS =
  "lakesideretreat.co.nz,www.lakesideretreat.co.nz";

/** Meta's standard Pixel base code, with the initial PageView. */
export function metaPixelBootstrapScript(pixelId: string): string {
  return [
    `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};`,
    `if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;`,
    `t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');`,
    `fbq('init','${pixelId}');`,
    `fbq('track','PageView');`,
  ].join("");
}

// ---------------------------------------------------------------------------
// Client-side event helpers. Safe to call when either tracker is absent
// (not configured, ad blocker, script still loading): they do nothing.
// ---------------------------------------------------------------------------

type Umami = { track: (name: string, data?: Record<string, unknown>) => void };
type Fbq = (...args: unknown[]) => void;

function getUmami(): Umami | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as unknown as { umami?: Umami }).umami;
}

function getFbq(): Fbq | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as unknown as { fbq?: Fbq }).fbq;
}

/**
 * The Umami script is deferred, so an event raised during hydration can beat
 * it. Retry briefly rather than drop it; give up quietly if it never loads
 * (blocked, or not configured).
 */
function withUmami(fn: (umami: Umami) => void, attemptsLeft = 20): void {
  const umami = getUmami();
  if (umami) {
    fn(umami);
    return;
  }
  if (typeof window === "undefined" || attemptsLeft <= 0) return;
  window.setTimeout(() => withUmami(fn, attemptsLeft - 1), 250);
}

export interface BookingEventDetails {
  accommodationId: string;
  accommodationName: string;
  value: number;
  currency: string;
  nights?: number;
}

/** Guest pressed "continue to payment" on the booking form. */
export function trackBeginCheckout(d: BookingEventDetails): void {
  // No retry here: the page navigates to Stripe immediately after.
  getUmami()?.track("checkout-started", {
    accommodation: d.accommodationName,
    value: d.value,
    currency: d.currency,
  });
  getFbq()?.("track", "InitiateCheckout", {
    currency: d.currency,
    value: d.value,
    content_ids: [d.accommodationId],
    content_type: "product",
  });
}

/**
 * A paid booking. Umami's revenue report reads the `revenue` and `currency`
 * properties. transactionId (the Stripe Checkout session id) lets Meta drop
 * duplicates if the success page is reloaded.
 */
export function trackPurchase(
  d: BookingEventDetails & { transactionId: string }
): void {
  withUmami((umami) =>
    umami.track("booking", {
      accommodation: d.accommodationName,
      nights: d.nights,
      revenue: d.value,
      currency: d.currency,
    })
  );
  getFbq()?.(
    "track",
    "Purchase",
    {
      currency: d.currency,
      value: d.value,
      content_ids: [d.accommodationId],
      content_type: "product",
    },
    { eventID: d.transactionId }
  );
}

/** Meta only counts the first page load; client navigations need this. */
export function trackMetaPageView(): void {
  getFbq()?.("track", "PageView");
}

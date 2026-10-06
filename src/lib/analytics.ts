/**
 * Visitor analytics: Google Analytics 4 and the Meta (Facebook/Instagram) Pixel.
 *
 * Both are off unless their ID is set in the environment, so a deploy without
 * the variables ships no third-party tracking at all:
 *
 *   GA_MEASUREMENT_ID  e.g. G-ABC123XYZ   (GA4 → Admin → Data streams)
 *   META_PIXEL_ID      e.g. 123456789012345 (Meta Events Manager)
 *
 * They are read at request time by a server component, not baked in at build
 * like NEXT_PUBLIC_* variables, so changing one on Render takes effect on the
 * next restart without a rebuild.
 *
 * The IDs are interpolated into inline <script> bodies, so each is checked
 * against its exact format first. Anything else is treated as unset rather
 * than escaped — a malformed ID would not track anything anyway.
 */

const GA_ID_PATTERN = /^G-[A-Z0-9]{4,20}$/;
const META_PIXEL_ID_PATTERN = /^\d{6,20}$/;

export interface AnalyticsIds {
  gaId: string | null;
  metaPixelId: string | null;
}

export function getAnalyticsIds(
  env: Record<string, string | undefined> = process.env
): AnalyticsIds {
  const ga = env.GA_MEASUREMENT_ID?.trim().toUpperCase();
  const meta = env.META_PIXEL_ID?.trim();
  return {
    gaId: ga && GA_ID_PATTERN.test(ga) ? ga : null,
    metaPixelId: meta && META_PIXEL_ID_PATTERN.test(meta) ? meta : null,
  };
}

/**
 * Google's standard gtag bootstrap, written as one inline script so it can
 * carry the CSP nonce. The external gtag.js it injects is then trusted via
 * 'strict-dynamic'. GA4's enhanced measurement records client-side route
 * changes as page views, so nothing extra is needed for Next navigation.
 */
export function gaBootstrapScript(gaId: string): string {
  return [
    `(function(){var s=document.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtag/js?id=${gaId}';document.head.appendChild(s);})();`,
    `window.dataLayer=window.dataLayer||[];`,
    `function gtag(){dataLayer.push(arguments);}`,
    `window.gtag=gtag;`,
    `gtag('js',new Date());`,
    `gtag('config','${gaId}');`,
  ].join("");
}

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
// (unset ID, ad blocker, script still loading): they do nothing.
// ---------------------------------------------------------------------------

type Gtag = (...args: unknown[]) => void;
type Fbq = (...args: unknown[]) => void;

function trackers(): { gtag?: Gtag; fbq?: Fbq } {
  if (typeof window === "undefined") return {};
  const w = window as unknown as { gtag?: Gtag; fbq?: Fbq };
  return { gtag: w.gtag, fbq: w.fbq };
}

export interface BookingEventDetails {
  accommodationId: string;
  accommodationName: string;
  value: number;
  currency: string;
  nights?: number;
}

function gaItems(d: BookingEventDetails) {
  return [
    {
      item_id: d.accommodationId,
      item_name: d.accommodationName,
      quantity: d.nights ?? 1,
    },
  ];
}

/** Guest pressed "continue to payment" on the booking form. */
export function trackBeginCheckout(d: BookingEventDetails): void {
  const { gtag, fbq } = trackers();
  gtag?.("event", "begin_checkout", {
    currency: d.currency,
    value: d.value,
    items: gaItems(d),
  });
  fbq?.("track", "InitiateCheckout", {
    currency: d.currency,
    value: d.value,
    content_ids: [d.accommodationId],
    content_type: "product",
  });
}

/**
 * A paid booking. transactionId (the Stripe Checkout session id) lets GA4
 * and Meta drop duplicates if the success page is reloaded.
 */
export function trackPurchase(
  d: BookingEventDetails & { transactionId: string }
): void {
  const { gtag, fbq } = trackers();
  gtag?.("event", "purchase", {
    transaction_id: d.transactionId,
    currency: d.currency,
    value: d.value,
    items: gaItems(d),
  });
  fbq?.(
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
  trackers().fbq?.("track", "PageView");
}

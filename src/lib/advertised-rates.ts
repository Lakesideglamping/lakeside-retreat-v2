/**
 * Advertised "from" prices for marketing copy: page titles, meta
 * descriptions, landing-page cards, the chatbot and structured data.
 *
 * These are NOT booking prices. The booking page quotes each night live from
 * Uplisting (lib/quote.ts) and never reads this file. This exists so the
 * dozens of places that want to say "from $449/night" share one number
 * instead of each carrying its own, which is how the site ended up
 * advertising $650 while charging $579.
 *
 * The figures are the lowest and highest nightly rates in Uplisting's
 * calendar for the coming year (checked 2026-10-25). When the Uplisting
 * rate ladder changes, update here and nowhere else.
 */
export const FROM_RATES = {
  "dome-pinot": 449,
  "dome-rose": 429,
  "lakeside-cottage": 240,
} as const;

export const PEAK_RATES = {
  "dome-pinot": 629,
  "dome-rose": 599,
  "lakeside-cottage": 370,
} as const;

export type AdvertisedId = keyof typeof FROM_RATES;

/** "$449" */
export function fromDollars(id: AdvertisedId): string {
  return `$${FROM_RATES[id]}`;
}

/** "from $449/night" */
export function fromRate(id: AdvertisedId): string {
  return `from ${fromDollars(id)}/night`;
}

/** Lowest advertised rate across all properties, in dollars. */
export const LOWEST_FROM_RATE = Math.min(...Object.values(FROM_RATES));

/** schema.org priceRange for the LodgingBusiness, e.g. "$240-$629 NZD per night". */
export function advertisedPriceRange(): string {
  const max = Math.max(...Object.values(PEAK_RATES));
  return `$${LOWEST_FROM_RATE}-$${max} NZD per night`;
}

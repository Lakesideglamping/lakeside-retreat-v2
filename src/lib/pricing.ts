import type { Accommodation } from "./accommodations";
import { addDays, nightsBetween } from "./date-range";

/**
 * Pure quote arithmetic for a stay. No I/O: the nightly rates come in from
 * the caller (see lib/quote.ts, which fetches them from Uplisting), so this
 * file is safe to import from client components and trivially testable.
 *
 * All money is in NZD cents, GST inclusive. The nightly figure is Uplisting's
 * spot rate for each night, shown to the guest as the direct price.
 */

export const SECOND_NIGHT_DISCOUNT_LABEL = "25% off your second night";
/** 25% off the second night of a two-night stay is 12.5% off the pair; the rule is applied as 12.5% off the nightly total on any stay of two or more nights. */
export const SECOND_NIGHT_DISCOUNT_RATE = 0.125;
export const SECOND_NIGHT_DISCOUNT_MIN_NIGHTS = 2;

export interface QuoteLineItem {
  label: string;
  /** Unit amount, NZD cents. */
  amountCents: number;
  quantity: number;
  /** amountCents × quantity. */
  totalCents: number;
}

export interface QuoteDiscount {
  label: string;
  amountCents: number;
}

export interface StayQuote {
  accommodationId: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  /** One entry per night slept, in order. */
  nightly: { date: string; rateCents: number }[];
  /** Everything charged, before any discount. */
  lineItems: QuoteLineItem[];
  subtotalCents: number;
  /** The dome second-night discount, or null when it does not apply. */
  discount: QuoteDiscount | null;
  /** What the guest pays: subtotal minus discount. */
  totalCents: number;
}

export interface BuildQuoteInput {
  accommodation: Accommodation;
  checkIn: string;
  checkOut: string;
  guests: number;
  pets?: number;
  /** Nightly rates in NZD dollars keyed by "YYYY-MM-DD". */
  rates: Record<string, number>;
}

/** Nights slept in [checkIn, checkOut): check-out morning is not a night. */
export function nightsOfStay(checkIn: string, checkOut: string): string[] {
  const nights: string[] = [];
  for (let d = checkIn; d < checkOut; d = addDays(d, 1)) nights.push(d);
  return nights;
}

/**
 * Build the quote for a stay from per-night rates.
 *
 * Returns null when any night of the stay has no rate — a price for part of a
 * stay is not a price. Callers treat null as "prices unavailable".
 */
export function buildStayQuote(input: BuildQuoteInput): StayQuote | null {
  const { accommodation, checkIn, checkOut, guests, rates } = input;
  const pets = input.pets ?? 0;
  const nights = nightsBetween(checkIn, checkOut);
  if (!(nights > 0)) return null;

  const nightly: StayQuote["nightly"] = [];
  for (const date of nightsOfStay(checkIn, checkOut)) {
    const rate = rates[date];
    if (!Number.isFinite(rate) || rate <= 0) return null;
    nightly.push({ date, rateCents: Math.round(rate * 100) });
  }

  const items: QuoteLineItem[] = [];
  const nightsLabel = `${nights} night${nights > 1 ? "s" : ""}`;
  const nightlyTotal = nightly.reduce((sum, n) => sum + n.rateCents, 0);
  const uniform = nightly.every((n) => n.rateCents === nightly[0].rateCents);

  // One rate for every night reads as "rate × nights"; varying rates are
  // shown as a single stay total, since a per-night list belongs in the
  // breakdown, not on a Stripe line.
  items.push(
    uniform
      ? {
          label: `${accommodation.name} (${nightsLabel})`,
          amountCents: nightly[0].rateCents,
          quantity: nights,
          totalCents: nightlyTotal,
        }
      : {
          label: `${accommodation.name} (${nightsLabel})`,
          amountCents: nightlyTotal,
          quantity: 1,
          totalCents: nightlyTotal,
        }
  );

  // Extra guest fee, per night per extra guest. Uplisting's day rate is for
  // the base occupancy; this stays a local add-on.
  if (accommodation.extraGuestFee && guests > accommodation.baseGuests) {
    const extraGuests = guests - accommodation.baseGuests;
    const amountCents = accommodation.extraGuestFee * 100;
    items.push({
      label: `Extra guest fee (${extraGuests} guest${extraGuests > 1 ? "s" : ""})`,
      amountCents,
      quantity: nights * extraGuests,
      totalCents: amountCents * nights * extraGuests,
    });
  }

  // Pet fee — a single FLAT fee per stay, regardless of how many pets
  // (max 2). Advertised everywhere as a flat fee per stay, so never
  // multiplied by the pet count.
  if (accommodation.petFee && pets > 0) {
    const amountCents = accommodation.petFee * 100;
    items.push({
      label: "Pet fee (flat, per stay)",
      amountCents,
      quantity: 1,
      totalCents: amountCents,
    });
  }

  const subtotalCents = items.reduce((sum, i) => sum + i.totalCents, 0);

  // Domes only: stay two nights or more and the second night is 25% off,
  // taken as 12.5% off the nightly total. The cottage has no such offer.
  let discount: QuoteDiscount | null = null;
  if (
    accommodation.secondNightDiscount &&
    nights >= SECOND_NIGHT_DISCOUNT_MIN_NIGHTS
  ) {
    const amountCents = Math.round(nightlyTotal * SECOND_NIGHT_DISCOUNT_RATE);
    if (amountCents > 0) {
      discount = { label: SECOND_NIGHT_DISCOUNT_LABEL, amountCents };
    }
  }

  return {
    accommodationId: accommodation.id,
    checkIn,
    checkOut,
    nights,
    nightly,
    lineItems: items,
    subtotalCents,
    discount,
    totalCents: subtotalCents - (discount?.amountCents ?? 0),
  };
}

export function formatNZD(amount: number): string {
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
  }).format(amount);
}

/** Format NZD cents, dropping ".00" so whole-dollar prices read cleanly. */
export function formatNZDCents(cents: number): string {
  const dollars = cents / 100;
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
    minimumFractionDigits: Number.isInteger(dollars) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(dollars);
}

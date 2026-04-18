import type { Accommodation } from "./accommodations";

export interface PriceLineItem {
  label: string;
  amount: number; // NZD dollars
  quantity: number;
  total: number; // amount * quantity
}

export interface PriceBreakdown {
  /** Line items that are actually charged to the guest. */
  lineItems: PriceLineItem[];
  /** Sum of the charged line items (does NOT include the security bond). */
  totalAmount: number; // NZD dollars
  /** Refundable security bond held via a separate Stripe pre-authorisation. */
  securityDeposit: number; // NZD dollars
}

function daysBetween(checkIn: string, checkOut: string): number {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  return Math.round(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  );
}

export function calculatePrice(
  accommodation: Accommodation,
  checkIn: string,
  checkOut: string,
  guests: number,
  pets: number = 0,
  seasonalMultiplier: number = 1.0
): PriceBreakdown {
  const nights = daysBetween(checkIn, checkOut);
  const items: PriceLineItem[] = [];

  const nightlyRate = Math.round(accommodation.basePrice * seasonalMultiplier);
  const nightlyLabel = seasonalMultiplier !== 1.0
    ? `${accommodation.name} — peak season (${nights} night${nights > 1 ? "s" : ""})`
    : `${accommodation.name} (${nights} night${nights > 1 ? "s" : ""})`;

  // Nightly rate
  items.push({
    label: nightlyLabel,
    amount: nightlyRate,
    quantity: nights,
    total: nightlyRate * nights,
  });

  // Cleaning is bundled into the nightly rate — no separate line item.

  // Extra guest fee
  if (accommodation.extraGuestFee && guests > accommodation.baseGuests) {
    const extraGuests = guests - accommodation.baseGuests;
    items.push({
      label: `Extra guest fee (${extraGuests} guest${extraGuests > 1 ? "s" : ""})`,
      amount: accommodation.extraGuestFee,
      quantity: nights * extraGuests,
      total: accommodation.extraGuestFee * nights * extraGuests,
    });
  }

  // Pet fee
  if (accommodation.petFee && pets > 0) {
    items.push({
      label: `Pet fee (${pets} pet${pets > 1 ? "s" : ""})`,
      amount: accommodation.petFee,
      quantity: pets,
      total: accommodation.petFee * pets,
    });
  }

  // Security deposit is a SEPARATE Stripe pre-authorisation, not a charge.
  // It is NOT included in totalAmount so the displayed total matches the
  // amount Stripe actually charges the card.
  const totalAmount = items.reduce((sum, i) => sum + i.total, 0);

  return {
    lineItems: items,
    totalAmount,
    securityDeposit: accommodation.securityDeposit,
  };
}

export function formatNZD(amount: number): string {
  return new Intl.NumberFormat("en-NZ", {
    style: "currency",
    currency: "NZD",
  }).format(amount);
}

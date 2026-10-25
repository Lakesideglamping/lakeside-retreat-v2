import { describe, it, expect } from "vitest";
import { quoteToLineItems } from "../stripe";
import { buildStayQuote, nightsOfStay } from "../pricing";
import type { Accommodation } from "../accommodations";

const dome: Accommodation = {
  id: "dome-pinot",
  name: "Dome Pinot",
  description: "",
  maxGuests: 2,
  baseGuests: 2,
  minStay: 1,
  adultsOnly: true,
  minimumAge: 18,
  secondNightDiscount: true,
  amenities: [],
  images: [],
};

const cottage: Accommodation = {
  id: "lakeside-cottage",
  name: "Lakeside Cottage",
  description: "",
  maxGuests: 3,
  baseGuests: 2,
  minStay: 2,
  adultsOnly: true,
  minimumAge: 18,
  extraGuestFee: 100,
  petFee: 25,
  amenities: [],
  images: [],
};

const flat = (rate: number, from: string, to: string) =>
  Object.fromEntries(nightsOfStay(from, to).map((d) => [d, rate]));

describe("quoteToLineItems", () => {
  it("maps the quote's charged items to Stripe line items in cents", () => {
    const quote = buildStayQuote({
      accommodation: cottage,
      checkIn: "2026-06-01",
      checkOut: "2026-06-03",
      guests: 3,
      pets: 1,
      rates: flat(350, "2026-06-01", "2026-06-03"),
    })!;
    const items = quoteToLineItems(quote);
    expect(items).toEqual([
      { name: "Lakeside Cottage (2 nights)", amount: 35000, quantity: 2 },
      { name: "Extra guest fee (1 guest)", amount: 10000, quantity: 2 },
      { name: "Pet fee (flat, per stay)", amount: 2500, quantity: 1 },
    ]);
  });

  it("keeps the discount out of the line items (it travels as a coupon)", () => {
    const quote = buildStayQuote({
      accommodation: dome,
      checkIn: "2026-06-01",
      checkOut: "2026-06-03",
      guests: 2,
      rates: flat(600, "2026-06-01", "2026-06-03"),
    })!;
    expect(quote.discount).not.toBeNull();
    const items = quoteToLineItems(quote);
    expect(items).toEqual([{ name: "Dome Pinot (2 nights)", amount: 60000, quantity: 2 }]);
    // Line items sum to the undiscounted subtotal; Stripe applies the coupon.
    const lineTotal = items.reduce((s, i) => s + i.amount * i.quantity, 0);
    expect(lineTotal).toBe(quote.subtotalCents);
    expect(lineTotal - quote.discount!.amountCents).toBe(quote.totalCents);
  });

  it("never emits a negative or zero amount (Stripe rejects them)", () => {
    const quote = buildStayQuote({
      accommodation: dome,
      checkIn: "2026-12-30",
      checkOut: "2027-01-02",
      guests: 2,
      rates: { "2026-12-30": 579, "2026-12-31": 899, "2027-01-01": 650 },
    })!;
    for (const item of quoteToLineItems(quote)) {
      expect(item.amount).toBeGreaterThan(0);
      expect(item.quantity).toBeGreaterThan(0);
    }
  });
});

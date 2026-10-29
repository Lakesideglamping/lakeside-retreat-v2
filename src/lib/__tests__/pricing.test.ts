import { describe, it, expect } from "vitest";
import {
  buildStayQuote,
  nightsOfStay,
  SECOND_NIGHT_DISCOUNT_LABEL,
  formatNZDCents,
  isPeakSeasonNight,
} from "../pricing";
import type { Accommodation } from "../accommodations";

// Fixtures mirror the real accommodations data, minus any nightly price:
// that comes from Uplisting and is passed in as `rates`.
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

describe("nightsOfStay", () => {
  it("lists the nights slept, excluding the check-out morning", () => {
    expect(nightsOfStay("2026-06-01", "2026-06-03")).toEqual(["2026-06-01", "2026-06-02"]);
  });

  it("crosses the NZ daylight-saving changeover without losing a night", () => {
    // Clocks go forward on 2026-09-27 in NZ.
    expect(nightsOfStay("2026-09-26", "2026-09-28")).toEqual(["2026-09-26", "2026-09-27"]);
  });
});

describe("buildStayQuote: nightly rates from Uplisting", () => {
  it("charges each night at its own Uplisting rate, in cents", () => {
    const quote = buildStayQuote({
      accommodation: dome,
      checkIn: "2026-06-01",
      checkOut: "2026-06-02",
      guests: 2,
      rates: { "2026-06-01": 579 },
    })!;
    expect(quote.nights).toBe(1);
    expect(quote.nightly).toEqual([{ date: "2026-06-01", rateCents: 57900 }]);
    expect(quote.subtotalCents).toBe(57900);
    expect(quote.discount).toBeNull();
    expect(quote.totalCents).toBe(57900);
  });

  it("collapses uniform nights into rate x nights for Stripe", () => {
    const quote = buildStayQuote({
      accommodation: cottage,
      checkIn: "2026-06-01",
      checkOut: "2026-06-04",
      guests: 2,
      rates: flat(350, "2026-06-01", "2026-06-04"),
    })!;
    expect(quote.lineItems[0]).toEqual({
      label: "Lakeside Cottage (3 nights)",
      amountCents: 35000,
      quantity: 3,
      totalCents: 105000,
    });
  });

  it("sums varying nights into one stay line", () => {
    const quote = buildStayQuote({
      accommodation: cottage,
      checkIn: "2026-12-30",
      checkOut: "2027-01-02",
      guests: 2,
      rates: { "2026-12-30": 350, "2026-12-31": 450, "2027-01-01": 400 },
    })!;
    expect(quote.lineItems[0]).toEqual({
      label: "Lakeside Cottage (3 nights)",
      amountCents: 120000,
      quantity: 1,
      totalCents: 120000,
    });
    expect(quote.nightly.map((n) => n.rateCents)).toEqual([35000, 45000, 40000]);
  });

  it("returns null when any night has no rate, never a partial price", () => {
    expect(
      buildStayQuote({
        accommodation: dome,
        checkIn: "2026-06-01",
        checkOut: "2026-06-03",
        guests: 2,
        rates: { "2026-06-01": 579 },
      })
    ).toBeNull();
  });

  it("returns null for an empty or inverted range", () => {
    expect(
      buildStayQuote({ accommodation: dome, checkIn: "2026-06-03", checkOut: "2026-06-03", guests: 2, rates: {} })
    ).toBeNull();
    expect(
      buildStayQuote({ accommodation: dome, checkIn: "2026-06-03", checkOut: "2026-06-01", guests: 2, rates: {} })
    ).toBeNull();
  });

  it("never carries a cleaning or security-deposit line", () => {
    const quote = buildStayQuote({
      accommodation: dome,
      checkIn: "2026-06-01",
      checkOut: "2026-06-03",
      guests: 2,
      rates: flat(579, "2026-06-01", "2026-06-03"),
    })!;
    const labels = quote.lineItems.map((i) => i.label.toLowerCase());
    expect(labels.some((l) => l.includes("cleaning"))).toBe(false);
    expect(labels.some((l) => l.includes("security"))).toBe(false);
  });
});

describe("buildStayQuote: dome second-night discount", () => {
  it("takes 12.5% off the nightly total for a dome on 2 nights, labelled exactly", () => {
    const quote = buildStayQuote({
      accommodation: dome,
      checkIn: "2026-06-01",
      checkOut: "2026-06-03",
      guests: 2,
      rates: flat(600, "2026-06-01", "2026-06-03"),
    })!;
    expect(quote.subtotalCents).toBe(120000);
    expect(quote.discount).toEqual({
      label: "25% off your second night",
      amountCents: 15000,
    });
    expect(quote.discount!.label).toBe(SECOND_NIGHT_DISCOUNT_LABEL);
    expect(quote.totalCents).toBe(105000);
  });

  it("applies on 3+ nights too (12.5% of the whole nightly total)", () => {
    const quote = buildStayQuote({
      accommodation: dome,
      checkIn: "2026-06-01",
      checkOut: "2026-06-04",
      guests: 2,
      rates: { "2026-06-01": 579, "2026-06-02": 579, "2026-06-03": 650 },
    })!;
    const nightly = 57900 + 57900 + 65000;
    expect(quote.discount!.amountCents).toBe(Math.round(nightly * 0.125));
    expect(quote.totalCents).toBe(nightly - Math.round(nightly * 0.125));
  });

  it("does not apply to a single dome night", () => {
    const quote = buildStayQuote({
      accommodation: dome,
      checkIn: "2026-06-01",
      checkOut: "2026-06-02",
      guests: 2,
      rates: { "2026-06-01": 579 },
    })!;
    expect(quote.discount).toBeNull();
    expect(quote.totalCents).toBe(quote.subtotalCents);
  });

  it("never applies to the cottage, however long the stay", () => {
    const quote = buildStayQuote({
      accommodation: cottage,
      checkIn: "2026-06-01",
      checkOut: "2026-06-06",
      guests: 2,
      rates: flat(350, "2026-06-01", "2026-06-06"),
    })!;
    expect(quote.discount).toBeNull();
    expect(quote.totalCents).toBe(5 * 35000);
  });

  it("is withdrawn over peak season, 12 Dec – 31 Mar", () => {
    // The request that introduced the rule: 12–14 Dec in Dome Pinot gets
    // no second-night discount.
    const peak = buildStayQuote({
      accommodation: dome,
      checkIn: "2026-12-12",
      checkOut: "2026-12-14",
      guests: 2,
      rates: flat(600, "2026-12-12", "2026-12-14"),
    })!;
    expect(peak.discount).toBeNull();
    expect(peak.totalCents).toBe(120000);

    // Deep in summer, and the last peak night (check-out 1 April).
    expect(
      buildStayQuote({
        accommodation: dome,
        checkIn: "2027-01-20",
        checkOut: "2027-01-22",
        guests: 2,
        rates: flat(600, "2027-01-20", "2027-01-22"),
      })!.discount
    ).toBeNull();
    expect(
      buildStayQuote({
        accommodation: dome,
        checkIn: "2027-03-30",
        checkOut: "2027-04-01",
        guests: 2,
        rates: flat(600, "2027-03-30", "2027-04-01"),
      })!.discount
    ).toBeNull();
  });

  it("is withdrawn from a stay that merely touches peak season", () => {
    // Nights of 10 and 11 Dec are fine; add the 12th and the whole stay
    // loses the offer rather than a pro-rated slice of it.
    expect(
      buildStayQuote({
        accommodation: dome,
        checkIn: "2026-12-10",
        checkOut: "2026-12-13",
        guests: 2,
        rates: flat(600, "2026-12-10", "2026-12-13"),
      })!.discount
    ).toBeNull();
  });

  it("still applies either side of peak season", () => {
    // Last two nights before the window: 10 and 11 Dec, check-out on the 12th.
    const before = buildStayQuote({
      accommodation: dome,
      checkIn: "2026-12-10",
      checkOut: "2026-12-12",
      guests: 2,
      rates: flat(600, "2026-12-10", "2026-12-12"),
    })!;
    expect(before.discount).toEqual({ label: SECOND_NIGHT_DISCOUNT_LABEL, amountCents: 15000 });

    // First two nights after it: 1 and 2 April.
    const after = buildStayQuote({
      accommodation: dome,
      checkIn: "2027-04-01",
      checkOut: "2027-04-03",
      guests: 2,
      rates: flat(600, "2027-04-01", "2027-04-03"),
    })!;
    expect(after.discount).toEqual({ label: SECOND_NIGHT_DISCOUNT_LABEL, amountCents: 15000 });
  });

  it("rounds the discount to whole cents", () => {
    const quote = buildStayQuote({
      accommodation: dome,
      checkIn: "2026-06-01",
      checkOut: "2026-06-03",
      guests: 2,
      rates: { "2026-06-01": 333.33, "2026-06-02": 333.33 },
    })!;
    expect(Number.isInteger(quote.discount!.amountCents)).toBe(true);
    expect(Number.isInteger(quote.totalCents)).toBe(true);
  });
});

describe("buildStayQuote: cottage add-ons", () => {
  it("adds the extra guest fee per night per guest above base", () => {
    const quote = buildStayQuote({
      accommodation: cottage,
      checkIn: "2026-06-01",
      checkOut: "2026-06-03",
      guests: 3,
      rates: flat(350, "2026-06-01", "2026-06-03"),
    })!;
    const extra = quote.lineItems.find((i) => i.label.includes("Extra guest"))!;
    expect(extra.amountCents).toBe(10000);
    expect(extra.quantity).toBe(2);
    expect(quote.totalCents).toBe(70000 + 20000);
  });

  it("omits the extra guest fee at base occupancy", () => {
    const quote = buildStayQuote({
      accommodation: cottage,
      checkIn: "2026-06-01",
      checkOut: "2026-06-03",
      guests: 2,
      rates: flat(350, "2026-06-01", "2026-06-03"),
    })!;
    expect(quote.lineItems.some((i) => i.label.includes("Extra guest"))).toBe(false);
  });

  it("charges the pet fee once per stay, not per pet or per night", () => {
    const quote = buildStayQuote({
      accommodation: cottage,
      checkIn: "2026-06-01",
      checkOut: "2026-06-04",
      guests: 2,
      pets: 2,
      rates: flat(350, "2026-06-01", "2026-06-04"),
    })!;
    const pet = quote.lineItems.find((i) => i.label.includes("Pet fee"))!;
    expect(pet.quantity).toBe(1);
    expect(pet.totalCents).toBe(2500);
    expect(quote.totalCents).toBe(3 * 35000 + 2500);
  });

  it("never bills a dome a pet fee", () => {
    const quote = buildStayQuote({
      accommodation: dome,
      checkIn: "2026-06-01",
      checkOut: "2026-06-02",
      guests: 2,
      pets: 2,
      rates: { "2026-06-01": 579 },
    })!;
    expect(quote.lineItems.some((i) => i.label.includes("Pet"))).toBe(false);
  });
});

describe("isPeakSeasonNight", () => {
  it("covers 12 Dec through 31 Mar inclusive, in any year", () => {
    expect(isPeakSeasonNight("2026-12-11")).toBe(false);
    expect(isPeakSeasonNight("2026-12-12")).toBe(true);
    expect(isPeakSeasonNight("2026-12-31")).toBe(true);
    expect(isPeakSeasonNight("2027-01-01")).toBe(true);
    expect(isPeakSeasonNight("2027-03-31")).toBe(true);
    expect(isPeakSeasonNight("2027-04-01")).toBe(false);
    expect(isPeakSeasonNight("2028-02-29")).toBe(true);
    expect(isPeakSeasonNight("2027-07-15")).toBe(false);
  });
});

describe("formatNZDCents", () => {
  it("drops the cents on whole dollars and keeps them otherwise", () => {
    expect(formatNZDCents(57900)).toBe("$579");
    expect(formatNZDCents(57950)).toBe("$579.50");
  });
});

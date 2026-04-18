import { describe, it, expect } from "vitest";
import { calculatePrice } from "../pricing";
import type { Accommodation } from "../accommodations";

// Test fixtures mirror the real accommodations data (GST-incl, cleaning bundled).
const dome: Accommodation = {
  id: "dome-pinot",
  name: "Dome Pinot",
  description: "",
  maxGuests: 2,
  baseGuests: 2,
  basePrice: 635,
  minStay: 1,
  securityDeposit: 300,
  adultsOnly: true,
  minimumAge: 18,
  amenities: [],
  images: [],
};

const cottage: Accommodation = {
  id: "lakeside-cottage",
  name: "Lakeside Cottage",
  description: "",
  maxGuests: 3,
  baseGuests: 2,
  basePrice: 365,
  minStay: 2,
  securityDeposit: 300,
  adultsOnly: true,
  minimumAge: 18,
  extraGuestFee: 50,
  petFee: 50,
  amenities: [],
  images: [],
};

describe("calculatePrice", () => {
  it("computes nightly rate × nights, excludes deposit, no cleaning line item", () => {
    const { totalAmount, lineItems, securityDeposit } = calculatePrice(
      dome,
      "2026-06-01",
      "2026-06-03",
      2
    );
    // 2 nights × $635 (no cleaning, no deposit in total)
    expect(totalAmount).toBe(635 * 2);
    expect(lineItems).toHaveLength(1); // nightly only
    expect(securityDeposit).toBe(300);
    expect(lineItems.find((i) => i.label.toLowerCase().includes("cleaning"))).toBeUndefined();
    expect(lineItems.find((i) => i.label.toLowerCase().includes("security"))).toBeUndefined();
  });

  it("adds extra guest fee for guests above base", () => {
    const { totalAmount } = calculatePrice(
      cottage,
      "2026-06-01",
      "2026-06-03",
      3 // 1 extra guest
    );
    // 2 nights × $365 + 2 nights × 1 extra guest × $50
    expect(totalAmount).toBe(365 * 2 + 2 * 1 * 50);
  });

  it("does not add extra guest fee when at base occupancy", () => {
    const { lineItems } = calculatePrice(cottage, "2026-06-01", "2026-06-03", 2);
    const hasExtraGuest = lineItems.some((i) => i.label.includes("Extra guest"));
    expect(hasExtraGuest).toBe(false);
  });

  it("adds pet fee per pet", () => {
    const { totalAmount, lineItems } = calculatePrice(
      cottage,
      "2026-06-01",
      "2026-06-03",
      2,
      2
    );
    const petItem = lineItems.find((i) => i.label.includes("Pet fee"));
    expect(petItem).toBeDefined();
    expect(petItem!.total).toBe(100); // 2 pets × $50
    expect(totalAmount).toBe(365 * 2 + 100);
  });

  it("applies seasonal multiplier to nightly rate", () => {
    const base = calculatePrice(dome, "2026-12-20", "2026-12-23", 2);
    const peak = calculatePrice(dome, "2026-12-20", "2026-12-23", 2, 0, 1.2);
    expect(peak.totalAmount).toBeGreaterThan(base.totalAmount);
    const peakNightly = peak.lineItems.find((i) => i.label.includes("peak season"));
    expect(peakNightly).toBeDefined();
    expect(peakNightly!.amount).toBe(Math.round(635 * 1.2));
  });

  it("does not label line item as peak season when multiplier is 1.0", () => {
    const { lineItems } = calculatePrice(dome, "2026-06-01", "2026-06-03", 2, 0, 1.0);
    const nightly = lineItems[0];
    expect(nightly.label).not.toContain("peak season");
  });

  it("returns security deposit separately from the charged total", () => {
    const { totalAmount, securityDeposit } = calculatePrice(
      dome,
      "2026-06-01",
      "2026-06-02",
      2
    );
    expect(totalAmount).toBe(635); // 1 night, cleaning bundled, no bond
    expect(securityDeposit).toBe(300);
  });
});

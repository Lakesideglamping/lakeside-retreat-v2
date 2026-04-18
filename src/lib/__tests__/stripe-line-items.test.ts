import { describe, it, expect } from "vitest";
import { calculateLineItems } from "../stripe";
import type { Accommodation } from "../accommodations";

const dome: Accommodation = {
  id: "dome-pinot",
  name: "Dome Pinot",
  description: "",
  maxGuests: 2,
  baseGuests: 2,
  basePrice: 530,
  minStay: 1,
  securityDeposit: 300,
  cleaningFee: 50,
  adultsOnly: true,
  amenities: [],
  images: [],
};

const cottage: Accommodation = {
  id: "lakeside-cottage",
  name: "Lakeside Cottage",
  description: "",
  maxGuests: 3,
  baseGuests: 2,
  basePrice: 295,
  minStay: 2,
  securityDeposit: 300,
  cleaningFee: 50,
  adultsOnly: false,
  extraGuestFee: 100,
  petFee: 50,
  amenities: [],
  images: [],
};

describe("calculateLineItems", () => {
  it("returns amounts in cents", () => {
    const { lineItems, totalAmount } = calculateLineItems(
      dome,
      "2026-06-01",
      "2026-06-03",
      2
    );
    // 2 nights × 53000 cents + 5000 cents cleaning
    expect(totalAmount).toBe(530 * 2 * 100 + 50 * 100);
    expect(lineItems[0].amount).toBe(530 * 100);
  });

  it("does NOT include security deposit in total", () => {
    const { totalAmount } = calculateLineItems(dome, "2026-06-01", "2026-06-03", 2);
    // deposit ($300) must not appear
    expect(totalAmount).toBe(530 * 2 * 100 + 50 * 100);
  });

  it("adds extra guest fee in cents × nights × extra guests", () => {
    const { totalAmount, lineItems } = calculateLineItems(
      cottage,
      "2026-06-01",
      "2026-06-03",
      3
    );
    const extra = lineItems.find((i) => i.name.includes("Extra guest"));
    expect(extra).toBeDefined();
    // 2 nights × 1 extra guest × $100 = $200 = 20000 cents
    expect(extra!.amount * extra!.quantity).toBe(20000);
    expect(totalAmount).toBe(295 * 2 * 100 + 50 * 100 + 20000);
  });

  it("applies seasonal multiplier and rounds to cents", () => {
    const base = calculateLineItems(dome, "2026-12-20", "2026-12-23", 2, 0, 1.0);
    const peak = calculateLineItems(dome, "2026-12-20", "2026-12-23", 2, 0, 1.2);
    const peakNightly = Math.round(530 * 1.2) * 100;
    expect(peak.lineItems[0].amount).toBe(peakNightly);
    expect(peak.totalAmount).toBeGreaterThan(base.totalAmount);
  });

  it("labels nightly item with peak season when multiplier > 1", () => {
    const { lineItems } = calculateLineItems(dome, "2026-12-20", "2026-12-22", 2, 0, 1.3);
    expect(lineItems[0].name).toContain("peak season");
  });

  it("adds pet fee per pet (not per night)", () => {
    const { lineItems } = calculateLineItems(cottage, "2026-06-01", "2026-06-04", 2, 2);
    const petItem = lineItems.find((i) => i.name.includes("Pet fee"));
    expect(petItem).toBeDefined();
    expect(petItem!.quantity).toBe(2); // 2 pets, quantity = pets count
    expect(petItem!.amount).toBe(50 * 100);
  });

  it("omits extra guest fee when at base occupancy", () => {
    const { lineItems } = calculateLineItems(cottage, "2026-06-01", "2026-06-03", 2);
    const extra = lineItems.find((i) => i.name.includes("Extra guest"));
    expect(extra).toBeUndefined();
  });
});

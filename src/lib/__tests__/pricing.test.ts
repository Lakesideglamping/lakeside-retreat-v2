import { describe, it, expect } from "vitest";
import { calculatePrice } from "../pricing";
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

describe("calculatePrice", () => {
  it("computes nightly rate × nights + cleaning fee + deposit", () => {
    const { totalAmount, lineItems } = calculatePrice(
      dome,
      "2026-06-01",
      "2026-06-03",
      2
    );
    // 2 nights × $530 + $50 cleaning + $300 deposit
    expect(totalAmount).toBe(530 * 2 + 50 + 300);
    expect(lineItems).toHaveLength(3); // nightly, cleaning, deposit
  });

  it("adds extra guest fee for guests above base", () => {
    const { totalAmount } = calculatePrice(
      cottage,
      "2026-06-01",
      "2026-06-03",
      3 // 1 extra guest
    );
    // 2 nights × $295 + $50 cleaning + 2 nights × 1 extra guest × $100 + $300 deposit
    expect(totalAmount).toBe(295 * 2 + 50 + 2 * 1 * 100 + 300);
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
    expect(totalAmount).toBe(295 * 2 + 50 + 100 + 300);
  });

  it("applies seasonal multiplier to nightly rate", () => {
    const base = calculatePrice(dome, "2026-12-20", "2026-12-23", 2);
    const peak = calculatePrice(dome, "2026-12-20", "2026-12-23", 2, 0, 1.2);
    // Peak nightly rate = round(530 * 1.2) = 636
    expect(peak.totalAmount).toBeGreaterThan(base.totalAmount);
    const peakNightly = peak.lineItems.find((i) => i.label.includes("peak season"));
    expect(peakNightly).toBeDefined();
    expect(peakNightly!.amount).toBe(Math.round(530 * 1.2));
  });

  it("does not label line item as peak season when multiplier is 1.0", () => {
    const { lineItems } = calculatePrice(dome, "2026-06-01", "2026-06-03", 2, 0, 1.0);
    const nightly = lineItems[0];
    expect(nightly.label).not.toContain("peak season");
  });

  it("booking total excludes the security deposit", () => {
    const { lineItems, totalAmount } = calculatePrice(dome, "2026-06-01", "2026-06-02", 2);
    const deposit = lineItems.find((i) => i.label.startsWith("Security bond"));
    expect(deposit).toBeDefined();
    const bookingTotal = totalAmount - deposit!.total;
    expect(bookingTotal).toBe(530 + 50); // 1 night + cleaning
  });
});

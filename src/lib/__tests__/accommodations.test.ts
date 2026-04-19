import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { getAll, getFromPrice } from "../accommodations";

describe("accommodations", () => {
  it("getFromPrice returns the minimum basePrice across all properties", () => {
    const expected = Math.min(...getAll().map((a) => a.basePrice));
    expect(getFromPrice()).toBe(expected);
    // Sanity: currently cottage at 365
    expect(getFromPrice()).toBe(365);
  });

  it("sticky-book-bar does not hardcode a dollar amount", () => {
    // The sticky bar renders on every public page, so its price must
    // derive from getFromPrice() — never a literal. Guarding against
    // a regression where someone types `$365` or similar back in.
    const source = readFileSync(
      join(__dirname, "..", "..", "components", "sticky-book-bar.tsx"),
      "utf8"
    );
    const hardcodedPrice = /\$\d{2,4}\b/.exec(source);
    expect(
      hardcodedPrice,
      `sticky-book-bar.tsx must derive price from getFromPrice(), found literal "${hardcodedPrice?.[0]}"`
    ).toBeNull();
    expect(source).toMatch(/getFromPrice\(\)/);
  });
});

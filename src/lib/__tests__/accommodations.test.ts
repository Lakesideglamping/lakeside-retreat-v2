import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { getAll, getById, getFromPrice } from "../accommodations";
import { calculateLineItems } from "../stripe";

describe("accommodations", () => {
  it("getFromPrice returns the minimum basePrice across all properties", () => {
    const expected = Math.min(...getAll().map((a) => a.basePrice));
    expect(getFromPrice()).toBe(expected);
    // Sanity: currently cottage at 350 (updated 2026-06 price change)
    expect(getFromPrice()).toBe(350);
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

describe("pet policy", () => {
  // Regression guard. Twice now, code has gated pets on `adultsOnly` — first
  // in the booking widget, then in the checkout API — which rejected dogs at
  // the pet-friendly cottage. "Adults only" (no children) and "pet friendly"
  // (dogs welcome) are independent; `petFee` is the only pets signal.

  it("only the Lakeside Cottage accepts pets", () => {
    const cottage = getById("lakeside-cottage")!;
    expect(cottage.petFee).toBeGreaterThan(0);

    for (const id of ["dome-pinot", "dome-rose"]) {
      expect(
        getById(id)!.petFee,
        `${id} must not accept pets`
      ).toBeUndefined();
    }
  });

  it("adultsOnly cannot be used as the pets signal", () => {
    // Every property is adults-only, so the flag carries no information
    // about pets — this is exactly why gating on it broke the cottage.
    expect(getAll().every((a) => a.adultsOnly)).toBe(true);
  });

  it("checkout validation gates pets on petFee, never adultsOnly", () => {
    const source = readFileSync(
      join(__dirname, "..", "..", "app", "api", "payments", "create-session", "route.ts"),
      "utf8"
    );
    // Strip comments first — this checks the logic, not the prose that
    // explains it (the guard's own comment mentions adultsOnly by name).
    const code = source
      .replace(/\/\*[\s\S]*?\*\//g, " ")
      .replace(/\/\/[^\n]*/g, " ")
      .replace(/\s+/g, " ");

    expect(
      code,
      "the pets guard in create-session must key off petFee"
    ).toMatch(/data\.pets[^;{]*petFee/);

    expect(
      /adultsOnly[^;{]*data\.pets|data\.pets[^;{]*adultsOnly/.test(code),
      "create-session must not reject pets based on adultsOnly — that blocks the pet-friendly cottage"
    ).toBe(false);
  });

  it("bills the cottage a flat pet fee and the domes none", () => {
    const cottage = getById("lakeside-cottage")!;
    const { lineItems } = calculateLineItems(
      cottage,
      "2026-09-23",
      "2026-09-26",
      2,
      2 // two dogs — still one flat fee
    );
    const petLine = lineItems.find((i) => i.name.includes("Pet"));
    expect(petLine, "cottage booking with pets must include a pet fee").toBeDefined();
    expect(petLine!.quantity).toBe(1);
    expect(petLine!.amount).toBe(cottage.petFee! * 100);

    for (const id of ["dome-pinot", "dome-rose"]) {
      const dome = getById(id)!;
      const result = calculateLineItems(dome, "2026-09-23", "2026-09-25", 2, 2);
      expect(
        result.lineItems.find((i) => i.name.includes("Pet")),
        `${id} must never be billed a pet fee`
      ).toBeUndefined();
    }
  });
});

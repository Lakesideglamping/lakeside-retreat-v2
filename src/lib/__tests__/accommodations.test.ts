import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { getAll, getById } from "../accommodations";
import { buildStayQuote, nightsOfStay } from "../pricing";

describe("accommodations", () => {
  it("carries no nightly price: rates come live from Uplisting", () => {
    // The booking page quotes Uplisting's calendar rate for each night. A
    // base price here would be a second source of truth that drifts.
    for (const acc of getAll()) {
      expect(acc, `${acc.id} must not carry a nightly price`).not.toHaveProperty("basePrice");
    }
    const source = readFileSync(join(__dirname, "..", "accommodations.ts"), "utf8");
    expect(source).not.toMatch(/basePrice/);
  });

  it("sticky-book-bar does not hardcode a dollar amount", () => {
    // The sticky bar renders on every public page. Nightly prices are live
    // and vary by date, so a literal here would be wrong most of the year.
    const source = readFileSync(
      join(__dirname, "..", "..", "components", "sticky-book-bar.tsx"),
      "utf8"
    );
    const hardcodedPrice = /\$\d{2,4}\b/.exec(source);
    expect(
      hardcodedPrice,
      `sticky-book-bar.tsx must not carry a price literal, found "${hardcodedPrice?.[0]}"`
    ).toBeNull();
  });

  it("only the two domes carry the second-night discount", () => {
    expect(getById("dome-pinot")!.secondNightDiscount).toBe(true);
    expect(getById("dome-rose")!.secondNightDiscount).toBe(true);
    expect(getById("lakeside-cottage")!.secondNightDiscount).toBeFalsy();
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
    const flat = (from: string, to: string) =>
      Object.fromEntries(nightsOfStay(from, to).map((d) => [d, 400]));
    const cottage = getById("lakeside-cottage")!;
    const { lineItems } = buildStayQuote({
      accommodation: cottage,
      checkIn: "2026-09-23",
      checkOut: "2026-09-26",
      guests: 2,
      pets: 2, // two dogs — still one flat fee
      rates: flat("2026-09-23", "2026-09-26"),
    })!;
    const petLine = lineItems.find((i) => i.label.includes("Pet"));
    expect(petLine, "cottage booking with pets must include a pet fee").toBeDefined();
    expect(petLine!.quantity).toBe(1);
    expect(petLine!.amountCents).toBe(cottage.petFee! * 100);

    for (const id of ["dome-pinot", "dome-rose"]) {
      const dome = getById(id)!;
      const result = buildStayQuote({
        accommodation: dome,
        checkIn: "2026-09-23",
        checkOut: "2026-09-25",
        guests: 2,
        pets: 2,
        rates: flat("2026-09-23", "2026-09-25"),
      })!;
      expect(
        result.lineItems.find((i) => i.label.includes("Pet")),
        `${id} must never be billed a pet fee`
      ).toBeUndefined();
    }
  });
});

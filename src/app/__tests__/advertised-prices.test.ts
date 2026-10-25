import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";
import { FROM_RATES, PEAK_RATES, fromRate, advertisedPriceRange } from "@/lib/advertised-rates";

/**
 * Marketing copy must not carry its own nightly prices.
 *
 * Booking prices come live from Uplisting. The only numbers allowed in
 * copy are the advertised "from" rates, and those live in one file
 * (lib/advertised-rates.ts) so they can be changed in one place. Before
 * this guard the site advertised $650 a night in eighty places while
 * charging $579, and the chatbot carried a third, different price list.
 */
const PUBLIC = join(__dirname, "..", "(public)");
const ROOT = join(__dirname, "..", "..", "..");

function tsxFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) tsxFiles(full, acc);
    else if (entry.endsWith(".tsx")) acc.push(full);
  }
  return acc;
}

describe("advertised prices", () => {
  it("no public page hard-codes a nightly price", () => {
    const offenders: string[] = [];
    for (const file of tsxFiles(PUBLIC)) {
      const source = readFileSync(file, "utf8");
      // Any "$NNN/night" except the $100 extra-guest fee, plus a bare
      // mention of a current or former nightly rate. Policy amounts (pet
      // fee $25, extra guest $100, deposit $300, $500 smoking charge) are
      // not nightly prices and are allowed.
      const m = /\$(?!100\b)\d{3}(?:\/night| per night| NZD)|\$(?:650|599|350|629|449|429|370|240)\b/.exec(source);
      if (m) offenders.push(`${file.replace(ROOT, "").replace(/\\/g, "/")}: "${m[0]}"`);
    }
    expect(
      offenders,
      "Use fromRate()/fromDollars() from lib/advertised-rates instead of a literal:\n  " + offenders.join("\n  ")
    ).toEqual([]);
  });

  it("no public page claims guests save OTA service fees", () => {
    // Airbnb charges this host a host-only fee, so guests pay no service
    // fee there; "save 12-18% in service fees" was untrue. The direct
    // incentives are the second-night offer and the BOOKDIRECT code.
    const offenders: string[] = [];
    for (const file of tsxFiles(PUBLIC)) {
      const source = readFileSync(file, "utf8");
      if (/service fees?|12.18%|Save vs\. Airbnb/i.test(source)) {
        offenders.push(file.replace(ROOT, "").replace(/\\/g, "/"));
      }
    }
    expect(offenders).toEqual([]);
  });

  it("the chatbot knowledge base uses the same from-rates", () => {
    const kb = JSON.parse(
      readFileSync(join(ROOT, "public", "chatbot-knowledge-base.json"), "utf8")
    ) as { accommodations: { id: keyof typeof FROM_RATES; price: { base: number } }[] };
    for (const acc of kb.accommodations) {
      expect(acc.price.base, `${acc.id} chatbot price`).toBe(FROM_RATES[acc.id]);
    }
  });

  it("formats rates and the schema.org price range from the one source", () => {
    expect(fromRate("lakeside-cottage")).toBe(`from $${FROM_RATES["lakeside-cottage"]}/night`);
    const max = Math.max(...Object.values(PEAK_RATES));
    const min = Math.min(...Object.values(FROM_RATES));
    expect(advertisedPriceRange()).toBe(`$${min}-$${max} NZD per night`);
    for (const id of Object.keys(FROM_RATES) as (keyof typeof FROM_RATES)[]) {
      expect(FROM_RATES[id]).toBeLessThanOrEqual(PEAK_RATES[id]);
    }
  });
});

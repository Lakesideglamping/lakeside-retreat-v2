import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

/**
 * Guards on things prisma/schema.prisma asserts that Prisma's client cannot
 * enforce correctly.
 */

const ROOT = join(__dirname, "..", "..", "..");

function sourceFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (entry === "generated" || entry === "node_modules") continue;
    if (statSync(full).isDirectory()) sourceFiles(full, acc);
    else if (/\.tsx?$/.test(entry) && !full.includes("__tests__")) acc.push(full);
  }
  return acc;
}

describe("bookings compound unique key", () => {
  /**
   * idx_bookings_unique_website_dates is a PARTIAL unique index:
   *
   *   UNIQUE (accommodation, check_in, check_out)
   *   WHERE booking_source = 'website' AND deleted_at IS NULL
   *
   * It is declared @@unique so schema.prisma describes the database honestly —
   * that uniqueness is the double-booking guard, and a schema saying @@index
   * would understate it.
   *
   * The cost is that Prisma then offers `accommodation_check_in_check_out` as
   * a findUnique/upsert/delete key, and its generated SQL does NOT include the
   * index's WHERE predicate. Verified against a real postgres: an OTA booking
   * and a cancelled website booking can share those three values, so such a
   * lookup matches two rows and silently returns the wrong one.
   *
   * Bookings are addressed by `id` everywhere. This fails if that changes.
   */
  it("is never used as a lookup key in application code", () => {
    const offenders: string[] = [];

    for (const file of sourceFiles(join(ROOT, "src"))) {
      const source = readFileSync(file, "utf8");
      if (source.includes("accommodation_check_in_check_out")) {
        offenders.push(file.replace(ROOT, "").replace(/\\/g, "/"));
      }
    }

    expect(
      offenders,
      "accommodation_check_in_check_out is a PARTIAL unique index. Prisma " +
        "ignores the WHERE predicate, so a lookup on it can match an OTA or " +
        "cancelled booking and return the wrong row. Query bookings by id, or " +
        "use findFirst with the full predicate:\n  " +
        offenders.join("\n  ")
    ).toEqual([]);
  });

  it("is still declared unique in the schema, matching the database", () => {
    // If this ever flips back to @@index, schema.prisma stops describing the
    // double-booking guard and a rebuild from it would drop the protection.
    const schema = readFileSync(join(ROOT, "prisma", "schema.prisma"), "utf8");
    expect(schema).toMatch(
      /@@unique\(\[accommodation, check_in, check_out\][^)]*idx_bookings_unique_website_dates/
    );
  });
});

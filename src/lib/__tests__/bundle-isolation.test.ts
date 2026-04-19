/**
 * Guards two bundle-isolation rules:
 *
 * 1. recharts (~400KB) must stay out of any non-analytics chunk.
 *    Only src/components/admin/analytics/** may import from "recharts".
 *
 * 2. The analytics page must dynamic-import AnalyticsContent so recharts
 *    is code-split out of the initial admin chunk.
 *
 * If either rule breaks, the admin bundle (and potentially other chunks
 * Next rolls up) inflates silently.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

const SRC = join(__dirname, "..", "..");

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (entry.endsWith(".tsx") || entry.endsWith(".ts")) out.push(full);
  }
  return out;
}

describe("bundle isolation", () => {
  it("recharts is only imported inside admin/analytics", () => {
    const offenders: string[] = [];
    for (const file of walk(SRC)) {
      // Skip tests themselves (they mention the rule in regex strings)
      if (file.includes("__tests__")) continue;
      const content = readFileSync(file, "utf8");
      if (/from\s+["']recharts["']/.test(content)) {
        if (!file.includes(join("admin", "analytics"))) {
          offenders.push(file.replace(SRC, "src"));
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("admin/analytics page defers recharts via client-side dynamic import", () => {
    // Page is a Server Component that delegates to AnalyticsLoader.
    const page = readFileSync(
      join(SRC, "app", "admin", "analytics", "page.tsx"),
      "utf8"
    );
    expect(page).toMatch(/AnalyticsLoader/);
    // Must not IMPORT AnalyticsContent directly (pulls recharts into server chunk).
    expect(page).not.toMatch(/import\s*\{[^}]*AnalyticsContent[^}]*\}/);

    // The loader is a client component that does the dynamic() with
    // ssr:false — this is where recharts actually gets split out.
    const loader = readFileSync(
      join(SRC, "components", "admin", "analytics", "analytics-loader.tsx"),
      "utf8"
    );
    expect(loader).toMatch(/^"use client"/);
    expect(loader).toMatch(/dynamic\(/);
    expect(loader).toMatch(/ssr:\s*false/);
    expect(loader).toMatch(/analytics-content/);
  });
});

/**
 * Guards the "no CSS background-image hero" rule.
 *
 * Hero sections used to set `style={{ backgroundImage: "url(...)" }}`
 * which bypassed next/image entirely — no LCP priority, no AVIF/WebP,
 * no responsive srcset. All public pages now use <HeroBackground>.
 *
 * If someone re-introduces an inline backgroundImage in a page under
 * src/app/(public)/, this test fails. The fix is to use <HeroBackground>
 * from src/components/hero-background.tsx instead.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

const PUBLIC_DIR = join(__dirname, "..", "..", "app", "(public)");

function walk(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      results.push(...walk(full));
    } else if (entry.endsWith(".tsx")) {
      results.push(full);
    }
  }
  return results;
}

describe("hero background rule", () => {
  it("no public page uses inline CSS backgroundImage for hero", () => {
    const offenders: string[] = [];
    for (const file of walk(PUBLIC_DIR)) {
      const content = readFileSync(file, "utf8");
      if (/backgroundImage\s*:/.test(content)) {
        offenders.push(file.replace(PUBLIC_DIR, "(public)"));
      }
    }
    expect(
      offenders,
      `Use <HeroBackground> instead of inline backgroundImage:\n${offenders.join("\n")}`
    ).toEqual([]);
  });
});

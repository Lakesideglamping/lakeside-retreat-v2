import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

/**
 * The root layout's title template appends " | Lakeside Retreat" to every
 * page title. Pages that also wrote the brand into their own title rendered
 * as "... | Lakeside Retreat | Lakeside Retreat". The template is the one
 * place the suffix is added; this keeps it that way.
 *
 * A page that genuinely needs the brand elsewhere in its title (the
 * homepage, brand-first) opts out of the template with `title: { absolute }`.
 */
const APP = join(__dirname, "..");

function pageFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (entry === "__tests__" || entry === "api") continue;
    if (statSync(full).isDirectory()) pageFiles(full, acc);
    else if (entry === "page.tsx") acc.push(full);
  }
  return acc;
}

describe("page titles", () => {
  it("root layout owns the ' | Lakeside Retreat' suffix via title.template", () => {
    const layout = readFileSync(join(APP, "layout.tsx"), "utf8");
    expect(layout).toMatch(/template:\s*"%s \| Lakeside Retreat"/);
  });

  it("no page repeats the brand in a templated title", () => {
    const offenders: string[] = [];
    for (const file of pageFiles(APP)) {
      const source = readFileSync(file, "utf8");
      // Plain `title: "..."` at the top level of `metadata` (two-space indent).
      // openGraph/twitter titles are deeper and are not templated.
      const m = /^  title:\s*"([^"]*)"/m.exec(source);
      if (m && /Lakeside Retreat/.test(m[1])) {
        offenders.push(file.replace(APP, "src/app").replace(/\\/g, "/") + ` -> "${m[1]}"`);
      }
    }
    expect(
      offenders,
      "These titles already contain the brand; the root layout template adds it, so it would render twice. " +
        "Drop it from the page title, or use `title: { absolute: ... }` if the brand must lead:\n  " +
        offenders.join("\n  ")
    ).toEqual([]);
  });
});

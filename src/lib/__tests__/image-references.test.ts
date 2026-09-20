/**
 * Guards every /images/... reference against the file actually existing.
 *
 * On 2026-09-20 an image recompression pass renamed eight files from .jpeg and
 * .webp to .jpg and updated most, but not all, of the places that referenced
 * them. Eleven references were left pointing at files that no longer existed:
 * one rendered image on /wanaka-day-trip, which would have shown as a broken
 * box, and ten entries in sitemap-images.xml.
 *
 * The sitemap ones were the dangerous half, because nothing would have looked
 * wrong. That file is what makes disallowing /_next/image in robots.txt safe:
 * it hands Google the originals under /images/ to index directly, instead of
 * the optimiser endpoint that twice exhausted the 512MB instance. Ten dead
 * entries there would have quietly removed the photos from image search while
 * every page still rendered perfectly.
 *
 * A rename is exactly the kind of change that looks finished when it isn't, so
 * this asserts the invariant rather than trusting the next sweep to be
 * complete. It costs milliseconds and needs no fixtures.
 *
 * If this fails: either the reference has a stale extension or filename, or the
 * file it names was deleted. Fix whichever is actually wrong — do not add it to
 * the allowlist below.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync, existsSync } from "fs";
import { join } from "path";

const SRC_DIR = join(__dirname, "..", "..");
const PUBLIC_DIR = join(__dirname, "..", "..", "..", "public");

/**
 * Only paths ending in a real image extension count. This is what keeps the
 * "/images/..." placeholder in hero-background.tsx's usage example out of the
 * results without needing to name it.
 */
const IMAGE_REF = /\/images\/[A-Za-z0-9_.@-]+\.(?:jpe?g|png|webp|avif|gif|svg|ico)/g;

/**
 * Documentation placeholders, not references to real files.
 *
 * Nothing belongs here except a path that appears in a comment purely as an
 * example. A genuinely missing file is a bug to fix, not an entry to add.
 */
const DOC_PLACEHOLDERS = new Set(["/images/foo.jpeg"]);

function walk(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      results.push(...walk(full));
    } else if (/\.tsx?$/.test(entry) && !/\.test\.tsx?$/.test(entry)) {
      results.push(full);
    }
  }
  return results;
}

describe("image references", () => {
  it("every /images/ path in src/ resolves to a file in public/images/", () => {
    const broken: string[] = [];
    const checked = new Set<string>();

    for (const file of walk(SRC_DIR)) {
      const content = readFileSync(file, "utf8");
      for (const match of content.matchAll(IMAGE_REF)) {
        const ref = match[0];
        if (DOC_PLACEHOLDERS.has(ref)) continue;
        checked.add(ref);
        if (!existsSync(join(PUBLIC_DIR, ref))) {
          broken.push(`${file.replace(SRC_DIR, "src")} -> ${ref}`);
        }
      }
    }

    // A pass that silently matched nothing would be worse than useless: it
    // would go green forever while the thing it guards rotted.
    expect(checked.size, "found no /images/ references at all — has the regex or layout changed?").toBeGreaterThan(50);

    expect(broken, `broken image references:\n${broken.join("\n")}`).toEqual([]);
  });

  it("the image sitemap in particular points only at real files", () => {
    // Called out separately because this is the failure with no visible
    // symptom — pages render fine while the photos drop out of image search.
    const sitemap = join(SRC_DIR, "app", "sitemap-images.xml", "route.ts");
    const content = readFileSync(sitemap, "utf8");

    const refs = [...content.matchAll(IMAGE_REF)].map((m) => m[0]);
    const missing = refs.filter((r) => !existsSync(join(PUBLIC_DIR, r)));

    expect(refs.length, "the image sitemap lists no images").toBeGreaterThan(20);
    expect(missing, `sitemap-images.xml advertises files that do not exist:\n${missing.join("\n")}`).toEqual([]);
  });
});

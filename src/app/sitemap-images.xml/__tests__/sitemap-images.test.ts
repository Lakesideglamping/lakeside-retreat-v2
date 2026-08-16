import { describe, it, expect } from "vitest";
import { existsSync, readFileSync, readdirSync } from "fs";
import { join } from "path";
import { GET } from "../route";

// Drift guard for the image sitemap.
//
// The page/image list in route.ts is hand-maintained, and it silently rotted:
// by 2026-08 it advertised three images that had been deleted from the repo
// entirely. Google fetches every <image:loc> in this file, so a dead entry is
// a 404 served straight to the crawler.
//
// These tests parse the real rendered XML rather than the TypeScript source,
// so they keep working if the list is ever refactored into a different shape.

const ROOT = join(__dirname, "..", "..", "..", "..");

async function renderSitemap() {
  const res = await GET();
  return res.text();
}

function pageFile(page: string) {
  const rel = page === "/" ? "page.tsx" : `${page.replace(/^\//, "")}/page.tsx`;
  return join(ROOT, "src", "app", "(public)", rel);
}

/**
 * A page's source plus the source of the local components it imports.
 * Several pages (notably /gallery) keep their images in a child component,
 * so scanning page.tsx alone would report false orphans.
 */
function readPageSources(page: string): string {
  const entry = pageFile(page);
  if (!existsSync(entry)) return "";

  let combined = readFileSync(entry, "utf8");

  for (const [, spec] of combined.matchAll(/from\s+"(@\/[^"]+)"/g)) {
    const base = join(ROOT, "src", spec.replace(/^@\//, ""));
    for (const candidate of [`${base}.tsx`, `${base}.ts`, join(base, "index.tsx")]) {
      if (existsSync(candidate)) {
        combined += readFileSync(candidate, "utf8");
        break;
      }
    }
  }

  return combined;
}

/** [{ page: "/dome-rose", images: ["/images/RoseArialView.jpg", ...] }, ...] */
function parseSitemap(xml: string) {
  return [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((block) => {
    const body = block[1];
    const page = /<loc>([^<]+)<\/loc>/.exec(body)![1];
    const images = [...body.matchAll(/<image:loc>([^<]+)<\/image:loc>/g)].map(
      (m) => m[1].replace(/^https?:\/\/[^/]+/, "")
    );
    return { page: page.replace(/^https?:\/\/[^/]+/, "") || "/", images };
  });
}

describe("image sitemap", () => {
  it("every advertised image exists in public/, matching case exactly", async () => {
    // Case matters. Windows resolves /images/Spa.JPEG to Spa.jpeg happily;
    // Render runs Linux and serves a 404. Compare against the real directory
    // listing rather than existsSync, which is case-insensitive here and so
    // cannot see the bug at all.
    const onDisk = new Set(readdirSync(join(ROOT, "public", "images")));
    const entries = parseSitemap(await renderSitemap());
    const dead: string[] = [];

    for (const { page, images } of entries) {
      for (const loc of images) {
        if (!onDisk.has(loc.replace("/images/", ""))) dead.push(`${page} -> ${loc}`);
      }
    }

    expect(
      dead,
      `Image sitemap points at files that do not exist. Google will 404 on ` +
        `these. Fix the path or drop the entry:\n  ${dead.join("\n  ")}`
    ).toEqual([]);
  });

  it("every advertised image actually appears on that page", async () => {
    // The check that matters most for SEO. Google discards an entry it cannot
    // find on the URL it is filed under, so a sitemap full of images the page
    // no longer renders is wasted crawl budget. 24 entries had drifted this
    // way before this test existed.
    const entries = parseSitemap(await renderSitemap());
    const orphans: string[] = [];

    for (const { page, images } of entries) {
      const source = readPageSources(page);
      for (const loc of images) {
        if (!source.includes(loc)) orphans.push(`${page} -> ${loc}`);
      }
    }

    expect(
      orphans,
      `Image sitemap advertises images the page does not render. Either add ` +
        `the image to the page or remove the sitemap entry:\n  ${orphans.join("\n  ")}`
    ).toEqual([]);
  });

  it("every listed page is a real public route", async () => {
    const entries = parseSitemap(await renderSitemap());
    const dead = entries.map((e) => e.page).filter((page) => !existsSync(pageFile(page)));

    expect(
      dead,
      `Image sitemap lists pages that no longer exist:\n  ${dead.join("\n  ")}`
    ).toEqual([]);
  });

  it("does not list the same image twice on one page", async () => {
    const entries = parseSitemap(await renderSitemap());
    const dupes: string[] = [];

    for (const { page, images } of entries) {
      const seen = new Set<string>();
      for (const loc of images) {
        if (seen.has(loc)) dupes.push(`${page} -> ${loc}`);
        seen.add(loc);
      }
    }

    expect(dupes, `Duplicate images within a page:\n  ${dupes.join("\n  ")}`).toEqual([]);
  });

  it("produces well-formed XML with a title for every image", async () => {
    const xml = await renderSitemap();

    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain('xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"');

    // Google requires image:loc; a title is our own quality bar. Every
    // image:image block must carry both.
    const blocks = [...xml.matchAll(/<image:image>([\s\S]*?)<\/image:image>/g)];
    expect(blocks.length).toBeGreaterThan(0);
    for (const [, body] of blocks) {
      expect(body).toMatch(/<image:loc>[^<]+<\/image:loc>/);
      expect(body).toMatch(/<image:title>[^<]+<\/image:title>/);
    }

    // Unescaped bare ampersands would break the feed.
    expect(/&(?!amp;|lt;|gt;|quot;|apos;)/.test(xml)).toBe(false);
  });
});

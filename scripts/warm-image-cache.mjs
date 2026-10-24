#!/usr/bin/env node
/**
 * Warms the /_next/image cache after anything that restarts the service.
 *
 * Why this exists:
 *   Render has no persistent disk on our plan, so the optimised-image cache
 *   lives in the container filesystem and is empty after every deploy, env-var
 *   change, plan change or settings save. Left to refill on demand it refills
 *   under whatever concurrency happens to arrive — which exhausted the old
 *   512MB instance twice in September 2026 and took the site down both times.
 *
 *   The 2GB plan removed the danger, but not the slowness: a cold cache means
 *   the first visitor to each image pays for the encode, and since AVIF was
 *   enabled those encodes are markedly slower than the WebP ones they replaced.
 *
 *   So we fill it deliberately: one request at a time, paced, so sharp never
 *   has more than one decode in flight.
 *
 * Three things this gets right that are easy to get wrong:
 *
 *   1. It sends a browser Accept header. Next picks the output format from
 *      Accept and caches per format, so warming with Node's default `*​/*`
 *      populates a different variant than real visitors request — leaving
 *      every visitor on a cold miss doing the encode this was meant to avoid.
 *
 *   2. It reads deviceSizes out of next.config.ts rather than restating them.
 *      An earlier version hardcoded three of the six widths, so half of them
 *      were never warmed and nobody noticed.
 *
 *   3. It derives the hero images from <HeroBackground> usages. Heroes render
 *      at sizes="100vw" and are the LCP element on their page, so they go
 *      first and a partial run still covers the pages people land on.
 *
 *   Both 2 and 3 fail loudly if they find nothing, because the failure mode
 *   they replace was silent.
 *
 * Usage:
 *   npm run warm:images                 # whole run
 *   node scripts/warm-image-cache.mjs 1 3   # part 1 of 3
 *
 *   The full run is ~534 requests and outlasts some CI/command timeouts. Split
 *   it rather than shortening the gap — the pacing is the safety mechanism.
 *
 *   BASE_URL overrides the target (defaults to the production site).
 *
 * Exit codes: 0 ok, 1 aborted on a slow response, 2 bad usage/parse failure.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { execSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BASE = process.env.BASE_URL || "https://lakesideretreat.co.nz";

/** Pacing between requests. This is the safety mechanism — do not shorten it. */
const GAP_MS = 1000;

/** A single request this slow means work is queueing. Queueing is how the site fell over. */
const SLOW_ABORT_MS = 15000;
const SLUGGISH_MS = 5000;
const SLUGGISH_STREAK_LIMIT = 3;

/** Chrome's. Must stay browser-like — see note 1 above. */
const ACCEPT = "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8";

function fail(message) {
  console.error(`  ${message}`);
  process.exit(2);
}

/** Read deviceSizes from next.config.ts so the two cannot drift apart. */
function readDeviceSizes() {
  const config = readFileSync(join(ROOT, "next.config.ts"), "utf8");
  const match = config.match(/deviceSizes:\s*\[([^\]]+)\]/);
  if (!match) {
    fail("could not find deviceSizes in next.config.ts — has the images config moved?");
  }
  const sizes = match[1]
    .split(",")
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isInteger(n) && n > 0);
  if (!sizes.length) fail("parsed deviceSizes but found no usable widths");
  return sizes;
}

/** Derive the hero images from the pages that render them. */
function readHeroImages() {
  const pagesDir = join(ROOT, "src", "app");
  const heroes = new Set();

  const walk = (dir) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (entry.endsWith(".tsx")) {
        const src = readFileSync(full, "utf8");
        // <HeroBackground> puts src on a following line, so look ahead a little
        // rather than requiring it on the same one.
        for (const m of src.matchAll(/<HeroBackground[\s\S]{0,400}?src="\/images\/([^"]+)"/g)) {
          heroes.add(m[1]);
        }
      }
    }
  };

  walk(pagesDir);
  if (!heroes.size) {
    fail("found no <HeroBackground> images — has the component been renamed?");
  }
  return heroes;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const part = Number(process.argv[2] || 1);
  const ofParts = Number(process.argv[3] || 1);
  if (!Number.isInteger(part) || !Number.isInteger(ofParts) || part < 1 || part > ofParts) {
    fail("usage: node scripts/warm-image-cache.mjs [part] [ofParts]");
  }

  const widths = readDeviceSizes();
  const heroNames = readHeroImages();
  // Warm what is DEPLOYED, not what is on disk. The live site is built from
  // git, so an untracked file in public/images does not exist in production
  // and warming it is a guaranteed 404 — reported as a failure, obscuring any
  // real one. This bit when fifty " - Copy" duplicates appeared locally: 139
  // files on disk, 89 actually deployed.
  //
  // Only formats next/image actually optimises. Favicons live here too and are
  // never served through the optimiser, so warming them is wasted work.
  const tracked = execSync("git ls-files public/images", { cwd: ROOT, encoding: "utf8" })
    .split(/\r?\n/)
    .filter(Boolean)
    .map((p) => p.replace(/^public\/images\//, ""));
  const all = tracked.filter(
    (f) => /\.(jpe?g|png|webp)$/i.test(f) && !/favicon|apple-touch-icon/i.test(f)
  );
  const heroes = all.filter((f) => heroNames.has(f));
  const rest = all.filter((f) => !heroNames.has(f));

  const allJobs = [];
  for (const f of [...heroes, ...rest]) {
    for (const w of widths) allJobs.push({ file: f, w });
  }

  const size = Math.ceil(allJobs.length / ofParts);
  const jobs = allJobs.slice((part - 1) * size, part * size);

  console.log(`  target:   ${BASE}`);
  console.log(`  images:   ${all.length} (${heroes.length} heroes, warmed first)`);
  console.log(`  widths:   ${widths.join("/")}  (from next.config.ts)`);
  console.log(`  part:     ${part} of ${ofParts} — ${jobs.length} of ${allJobs.length} requests`);
  console.log(`  abort if any request exceeds ${SLOW_ABORT_MS / 1000}s\n`);

  let ok = 0;
  let failed = 0;
  let slowest = 0;
  let sluggishStreak = 0;

  for (const [i, job] of jobs.entries()) {
    const url = `${BASE}/_next/image?url=${encodeURIComponent(`/images/${job.file}`)}&w=${job.w}&q=75`;
    const started = Date.now();
    let status = 0;
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(SLOW_ABORT_MS + 5000),
        headers: { "User-Agent": "lakeside-cache-warm/1.0", Accept: ACCEPT },
      });
      status = res.status;
      // Drain the body, or the bytes never transfer and nothing is warmed.
      await res.arrayBuffer();
    } catch {
      status = 0;
    }
    const ms = Date.now() - started;
    slowest = Math.max(slowest, ms);
    status === 200 ? ok++ : failed++;

    const flag = ms >= SLOW_ABORT_MS ? " <<< TOO SLOW" : ms >= SLUGGISH_MS ? " <-- sluggish" : "";
    if (flag || i % 25 === 0 || status !== 200) {
      console.log(
        `  [${String(i + 1).padStart(3)}/${jobs.length}] ${String(status).padEnd(3)} ${String(ms).padStart(5)}ms  w=${String(job.w).padEnd(4)} ${job.file}${flag}`
      );
    }

    if (ms >= SLOW_ABORT_MS) {
      console.error(`\n  ABORTED — one request took ${ms}ms. That is the saturation signature.`);
      process.exit(1);
    }
    sluggishStreak = ms >= SLUGGISH_MS ? sluggishStreak + 1 : 0;
    if (sluggishStreak >= SLUGGISH_STREAK_LIMIT) {
      console.error(`\n  ABORTED — ${sluggishStreak} slow responses in a row; the instance is struggling.`);
      process.exit(1);
    }

    await sleep(GAP_MS);
  }

  console.log(`\n  done. ok=${ok} failed=${failed} slowest=${slowest}ms`);
  if (failed) console.log("  (a cold miss is not fatal, but worth a look)");
}

main();

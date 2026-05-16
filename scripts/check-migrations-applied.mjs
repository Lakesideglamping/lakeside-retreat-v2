#!/usr/bin/env node
/**
 * Fails the build if any migration in prisma/migrations/ is missing from
 * the database's _prisma_migrations table after `prisma migrate deploy`
 * supposedly ran.
 *
 * Why this exists:
 *   `prisma migrate deploy` can silently no-op when the DATABASE_URL points
 *   at a database whose _prisma_migrations table was rebuilt or migrated
 *   from another source. The deploy succeeds, the app boots, and the first
 *   query that hits a missing column 500s in production.
 *
 *   We hit this exact bug after switching the production DB user — only
 *   0_init was recorded; six migrations on disk had never actually run.
 *   This script would have failed the build instead of letting it ship.
 *
 * Wire-in: `npm run check:migrations` after `prisma migrate deploy` in
 * render.yaml. Exits non-zero on any drift, which fails the deploy.
 *
 * Exit codes:
 *   0 — every migration on disk is recorded as applied
 *   1 — drift detected (one or more disk migrations not applied)
 *   2 — tooling error (DB unreachable, missing env, etc.)
 */

import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";

const MIGRATIONS_DIR = "prisma/migrations";

if (!process.env.DATABASE_URL) {
  console.error("[check-migrations] DATABASE_URL is not set");
  process.exit(2);
}

// Migration folders are timestamp-prefixed (e.g. 20260421010000_name) plus
// the legacy `0_init`. Anything else (README.md, migration_lock.toml) is
// noise we skip.
function listDiskMigrations() {
  return readdirSync(MIGRATIONS_DIR)
    .filter((name) => {
      const full = join(MIGRATIONS_DIR, name);
      try {
        if (!statSync(full).isDirectory()) return false;
      } catch {
        return false;
      }
      return /^(0_init|\d{14}_)/.test(name);
    })
    .sort();
}

async function main() {
  const disk = listDiskMigrations();
  if (disk.length === 0) {
    console.error("[check-migrations] No migrations found on disk — refusing to validate against an empty set");
    process.exit(2);
  }

  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  let applied;
  try {
    const res = await client.query(
      "SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL"
    );
    applied = new Set(res.rows.map((r) => r.migration_name));
  } catch (err) {
    console.error("[check-migrations] Failed to read _prisma_migrations:", err.message);
    await client.end();
    process.exit(2);
  } finally {
    // end() is in finally so a failed query doesn't leak the connection.
  }

  await client.end();

  const missing = disk.filter((name) => !applied.has(name));
  if (missing.length === 0) {
    console.log(`[check-migrations] OK — all ${disk.length} migrations applied`);
    process.exit(0);
  }

  console.error(
    `[check-migrations] DRIFT — ${missing.length} migration(s) on disk are not recorded as applied in the database:`
  );
  for (const name of missing) console.error(`  - ${name}`);
  console.error("");
  console.error("Run `npx prisma migrate deploy` against the production DB to apply them.");
  process.exit(1);
}

main().catch((err) => {
  console.error("[check-migrations] Unexpected error:", err);
  process.exit(2);
});

#!/usr/bin/env node
/**
 * Fails if prisma/schema.prisma has changes not captured by any migration.
 *
 * Wire into CI (or a pre-push hook) so schema edits cannot merge without a
 * matching migration file. This is the regression guard for the "Prisma
 * migrate deploy is a silent no-op" audit finding.
 *
 * Exit codes:
 *   0 — schema and migrations are in sync
 *   1 — drift detected (schema ahead of migrations, or vice versa)
 *   2 — tooling error (prisma CLI missing, etc.)
 */

import { execSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const MIGRATIONS_DIR = "prisma/migrations";
const SCHEMA_PATH = "prisma/schema.prisma";

if (!existsSync(SCHEMA_PATH)) {
  console.error(`[check-schema-drift] ${SCHEMA_PATH} not found`);
  process.exit(2);
}

if (!existsSync(MIGRATIONS_DIR)) {
  console.error(
    `[check-schema-drift] ${MIGRATIONS_DIR} not found — run "prisma migrate dev" to bootstrap`
  );
  process.exit(1);
}

// Concatenate every migration.sql into a single virtual "from" schema.
const migrationFiles = readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => join(MIGRATIONS_DIR, e.name, "migration.sql"))
  .filter((p) => existsSync(p));

if (migrationFiles.length === 0) {
  console.error("[check-schema-drift] no migration.sql files found under prisma/migrations/");
  process.exit(1);
}

// Use `prisma migrate diff` with --exit-code: it exits 0 if no diff, 2 if
// there IS a diff. We invert that to a PASS/FAIL.
try {
  execSync(
    `npx prisma migrate diff ` +
      `--from-migrations ${MIGRATIONS_DIR} ` +
      `--to-schema-datamodel ${SCHEMA_PATH} ` +
      `--shadow-database-url "file:./_drift-check.db" ` +
      `--exit-code`,
    { stdio: ["ignore", "pipe", "pipe"] }
  );
  console.log("[check-schema-drift] OK — schema and migrations in sync");
  process.exit(0);
} catch (err) {
  const status = err.status;
  if (status === 2) {
    console.error(
      "[check-schema-drift] DRIFT DETECTED — schema.prisma has changes not reflected in any migration.\n" +
        "Run: npx prisma migrate dev --name <short_description>"
    );
    process.exit(1);
  }
  console.error("[check-schema-drift] tooling error:", err.message);
  process.exit(2);
}

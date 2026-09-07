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

// Replaying a migrations directory needs a shadow database of the same
// provider. Prisma 7 takes it from `datasource.shadowDatabaseUrl` in
// prisma.config.ts, which reads SHADOW_DATABASE_URL — there is no CLI flag
// any more.
const shadowUrl = process.env.SHADOW_DATABASE_URL;

if (!shadowUrl) {
  console.error(
    "[check-schema-drift] SHADOW_DATABASE_URL is not set.\n" +
      "  This check replays prisma/migrations into a throwaway PostgreSQL\n" +
      "  database and diffs the result against prisma/schema.prisma.\n" +
      "  CI provides one via a postgres service container."
  );
  process.exit(2);
}

// Prisma DROPS AND RECREATES the shadow database's schema. Pointing it at a
// real database would destroy it, so refuse outright rather than trust the
// caller to have set the right value.
if (process.env.DATABASE_URL && shadowUrl === process.env.DATABASE_URL) {
  console.error(
    "[check-schema-drift] REFUSING TO RUN: SHADOW_DATABASE_URL is identical to\n" +
      "  DATABASE_URL. Prisma wipes the shadow database — this would destroy\n" +
      "  the real one. Point SHADOW_DATABASE_URL at a disposable database."
  );
  process.exit(2);
}

// `prisma migrate diff --exit-code` exits 0 when there is no diff and 2 when
// there is. We invert that into a PASS/FAIL.
try {
  execSync(
    `npx prisma migrate diff ` +
      `--from-migrations ${MIGRATIONS_DIR} ` +
      `--to-schema ${SCHEMA_PATH} ` +
      `--exit-code`,
    { stdio: ["ignore", "pipe", "pipe"] }
  );
  console.log("[check-schema-drift] OK — schema and migrations in sync");
  process.exit(0);
} catch (err) {
  const status = err.status;
  if (status === 2) {
    console.error(
      "[check-schema-drift] DRIFT DETECTED — schema.prisma has changes not reflected in any migration."
    );

    // Show what actually differs. Without this the failure says only that
    // something drifted, which is not enough to act on — the SQL below is
    // exactly what a new migration would need to contain.
    try {
      const sql = execSync(
        `npx prisma migrate diff ` +
          `--from-migrations ${MIGRATIONS_DIR} ` +
          `--to-schema ${SCHEMA_PATH} ` +
          `--script`,
        { stdio: ["ignore", "pipe", "pipe"] }
      ).toString();
      console.error("\n--- SQL needed to close the gap ---\n" + sql.trim() + "\n");
    } catch (diffErr) {
      console.error(
        "  (could not render the diff: " +
          (diffErr instanceof Error ? diffErr.message : String(diffErr)) +
          ")"
      );
    }

    console.error("Fix: npx prisma migrate dev --name <short_description>");
    process.exit(1);
  }
  console.error("[check-schema-drift] tooling error:", err.message);
  process.exit(2);
}

-- Partial index for soft-delete queries.
-- Every booking fetch filters WHERE deleted_at IS NULL. Without this index,
-- the query planner full-scans the table as data grows.
CREATE INDEX IF NOT EXISTS "idx_bookings_deleted_at"
  ON "bookings" ("deleted_at")
  WHERE "deleted_at" IS NOT NULL;

-- Partial unique index to prevent duplicate website bookings for the same
-- accommodation and dates. OTA bookings are exempt (different booking_source).
-- Cancelled bookings are exempt (deleted_at IS NOT NULL) so guests can rebook.
CREATE UNIQUE INDEX IF NOT EXISTS "idx_bookings_unique_website_dates"
  ON "bookings" ("accommodation", "check_in", "check_out")
  WHERE "booking_source" = 'website' AND "deleted_at" IS NULL;

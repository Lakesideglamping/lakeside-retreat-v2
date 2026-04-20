-- Covers the release-deposits cron query:
--   WHERE security_deposit_status = 'held'
--     AND deposit_release_due <= now()
-- Without this index, each cron run is a full table scan on bookings.
CREATE INDEX IF NOT EXISTS "idx_bookings_deposit_release"
  ON "bookings" ("security_deposit_status", "deposit_release_due");

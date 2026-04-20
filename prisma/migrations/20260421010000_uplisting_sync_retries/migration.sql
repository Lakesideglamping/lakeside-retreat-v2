-- Add uplisting_sync_retries counter to bookings table.
-- Used by the retry cron to cap automatic retries at MAX_RETRIES (3).
-- Bookings that exceed the cap are marked unrecoverable so the cron
-- stops hammering a broken Uplisting API and alerts instead.
ALTER TABLE "bookings"
  ADD COLUMN IF NOT EXISTS "uplisting_sync_retries" INTEGER NOT NULL DEFAULT 0;

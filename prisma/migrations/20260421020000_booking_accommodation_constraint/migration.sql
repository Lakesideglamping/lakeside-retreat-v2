-- Add check constraint to prevent invalid accommodation values being saved.
-- Any INSERT or UPDATE with accommodation not in this list will be rejected
-- at the DB level, preventing silent data corruption from Uplisting mapping
-- failures or code bugs.
--
-- Also add the uplisting_sync_retries column if the previous migration
-- didn't run (belt-and-suspenders for deploy ordering).
ALTER TABLE "bookings"
  ADD COLUMN IF NOT EXISTS "uplisting_sync_retries" INTEGER NOT NULL DEFAULT 0;

-- Constraint is added only if it doesn't already exist.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'bookings_accommodation_check'
  ) THEN
    ALTER TABLE "bookings"
      ADD CONSTRAINT "bookings_accommodation_check"
      CHECK (accommodation IN ('dome-pinot', 'dome-rose', 'lakeside-cottage'));
  END IF;
END $$;

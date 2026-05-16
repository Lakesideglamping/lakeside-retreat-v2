-- Convert bookings.deposit_release_due from TEXT to TIMESTAMPTZ.
--
-- The column previously stored ISO-8601 strings via .toISOString(). The
-- release-deposits cron compared them with `lte: nowIso` (also a string),
-- which happens to work because ISO-8601 sorts lexicographically — but
-- it's a type smell and one missed format change away from silently
-- returning zero rows.
--
-- Existing string values are all ISO-8601, so a straight CAST works.
-- USING handles the conversion in place; the column stays NULL-allowing
-- so OTA bookings without a deposit are unaffected.
--
-- Idempotent: only runs if the column is still TEXT.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bookings'
      AND column_name = 'deposit_release_due'
      AND data_type = 'text'
  ) THEN
    ALTER TABLE "bookings"
      ALTER COLUMN "deposit_release_due"
      TYPE TIMESTAMPTZ
      USING "deposit_release_due"::TIMESTAMPTZ;
  END IF;
END $$;

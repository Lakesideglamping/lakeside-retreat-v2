-- Adds composite indexes on `reviews` to cover the three hot read paths:
--   1. Public /reviews page:     WHERE status='approved' ORDER BY stay_date DESC
--   2. Admin reviews list:       WHERE status=? ORDER BY created_at DESC
--   3. structured-data fetch:    WHERE status='approved' AND property=?
-- Without these, every page render does a seq scan; rows grow ~linearly with
-- bookings so this bites at scale. CONCURRENTLY keeps the table writable
-- while the index builds; safe because these are additive and postgres
-- locks lightly for read queries.

CREATE INDEX IF NOT EXISTS "reviews_status_stay_date_idx"
  ON "reviews" ("status", "stay_date" DESC);

CREATE INDEX IF NOT EXISTS "reviews_status_created_at_idx"
  ON "reviews" ("status", "created_at" DESC);

CREATE INDEX IF NOT EXISTS "reviews_status_property_idx"
  ON "reviews" ("status", "property");

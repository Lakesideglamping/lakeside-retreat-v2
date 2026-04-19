-- Manual migration: drop the duplicate index on bookings(created_at).
--
-- Context: the bookings table had two indexes on the same column —
-- idx_bookings_created and idx_bookings_created_at. Both index the
-- (created_at) column, so every write paid the cost of maintaining
-- two structurally identical B-trees.
--
-- The Prisma schema was updated in commit 11a25ab to declare only
-- idx_bookings_created_at. Because this project uses `prisma db push`
-- rather than formal migrations, the duplicate must be dropped from
-- production by hand.
--
-- Safe to run: only drops the duplicate; idx_bookings_created_at
-- remains so query plans don't change.
--
-- How to run (from Render shell or any psql connected to prod):
--   psql "$DATABASE_URL" -f prisma/manual-migrations/001-drop-duplicate-bookings-index.sql

DROP INDEX IF EXISTS idx_bookings_created;

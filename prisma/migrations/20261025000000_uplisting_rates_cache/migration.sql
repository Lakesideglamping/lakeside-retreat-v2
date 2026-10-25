-- Nightly prices now come from Uplisting, not from a base price in code
-- multiplied by an admin-entered seasonal multiplier.
--
-- uplisting_rates holds the last successfully fetched calendar rates per
-- property. It is the fallback when the Uplisting API is unreachable: the
-- booking page serves this copy, and if there is none it says prices are
-- unavailable rather than showing a number that may be wrong. It has to be
-- in Postgres because Render's filesystem and process memory are wiped on
-- every restart, which is exactly when a cold cache hurts most.
CREATE TABLE IF NOT EXISTS "uplisting_rates" (
    "accommodation" TEXT NOT NULL,
    "rates" JSONB NOT NULL,
    "fetched_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "uplisting_rates_pkey" PRIMARY KEY ("accommodation")
);

-- seasonal_rates stored multipliers on a nightly base price that no longer
-- exists anywhere in the application. Uplisting's own calendar already carries
-- seasonal pricing, so applying a multiplier on top would double-charge peak
-- dates. The admin Pricing page, its API routes and the lookup in checkout
-- are removed in the same change, so nothing reads this table any more.
--
-- Idempotent, so a re-run against an already-migrated database is a no-op.
DROP TABLE IF EXISTS "seasonal_rates";

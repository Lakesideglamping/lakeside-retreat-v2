-- Indexes for cron job query patterns.
--
-- abandoned_checkout_reminders: cron finds rows needing a reminder send via
--   WHERE reminder_count < 3 AND last_reminder_sent_at < now() - interval '7 days'
-- Without this index the cron does a full table scan on every hourly tick.
CREATE INDEX IF NOT EXISTS "idx_abandoned_reminder_count_sent_at"
  ON "abandoned_checkout_reminders" ("reminder_count", "last_reminder_sent_at");

-- review_requests: cron finds rows needing a review invite via
--   WHERE status = 'pending' AND last_request_sent_at < now() - interval '7 days'
-- Without this index the cron does a full table scan on every hourly tick.
CREATE INDEX IF NOT EXISTS "idx_review_requests_status_sent_at"
  ON "review_requests" ("status", "last_request_sent_at");

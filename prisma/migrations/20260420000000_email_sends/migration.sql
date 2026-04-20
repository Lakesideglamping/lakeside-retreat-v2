-- Per-booking email send log. Populated by lib/email.ts on every sendMail
-- attempt so the admin UI can answer "did guest X get their pre-arrival?"
-- without digging through server logs.
--
-- booking_id is nullable because some sends (system alerts, contact-form
-- acknowledgements) aren't tied to a booking. Status is 'sent' on success
-- or 'failed' if the SMTP send threw; error captures the exception message.

CREATE TABLE IF NOT EXISTS "email_sends" (
  "id"         SERIAL       PRIMARY KEY,
  "booking_id" TEXT,
  "template"   TEXT         NOT NULL,
  "recipient"  TEXT         NOT NULL,
  "subject"    TEXT         NOT NULL,
  "status"     TEXT         NOT NULL DEFAULT 'sent',
  "error"      TEXT,
  "sent_at"    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "email_sends_booking_id_idx"
  ON "email_sends" ("booking_id", "sent_at" DESC);

CREATE INDEX IF NOT EXISTS "email_sends_sent_at_idx"
  ON "email_sends" ("sent_at" DESC);

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "abandoned_checkout_reminders" (
    "id" SERIAL NOT NULL,
    "booking_id" TEXT NOT NULL,
    "guest_email" TEXT NOT NULL,
    "guest_name" TEXT,
    "accommodation" TEXT,
    "check_in" TEXT,
    "check_out" TEXT,
    "reminder_count" INTEGER DEFAULT 0,
    "last_reminder_sent_at" TEXT,
    "last_error" TEXT,
    "created_at" TEXT DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "abandoned_checkout_reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" SERIAL NOT NULL,
    "admin_user" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "guest_name" TEXT NOT NULL,
    "guest_email" TEXT NOT NULL,
    "guest_phone" TEXT,
    "accommodation" TEXT NOT NULL,
    "check_in" DATE NOT NULL,
    "check_out" DATE NOT NULL,
    "guests" INTEGER NOT NULL,
    "total_price" DECIMAL(10,2),
    "status" TEXT DEFAULT 'confirmed',
    "payment_status" TEXT DEFAULT 'pending',
    "notes" TEXT,
    "stripe_session_id" TEXT,
    "stripe_payment_id" TEXT,
    "uplisting_id" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "deposit_release_due" TEXT,
    "booking_source" TEXT DEFAULT 'unknown',
    "uplisting_sync_status" TEXT DEFAULT 'pending',
    "security_deposit_intent_id" TEXT,
    "security_deposit_status" TEXT DEFAULT 'pending',
    "security_deposit_amount" DECIMAL(10,2) DEFAULT 300.00,
    "security_deposit_released_at" TIMESTAMP(6),
    "security_deposit_claimed_amount" DECIMAL(10,2) DEFAULT 0,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_messages" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contact_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "failed_webhook_events" (
    "id" SERIAL NOT NULL,
    "event_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "stripe_session_id" TEXT,
    "stripe_payment_id" TEXT,
    "booking_id" TEXT,
    "event_data" TEXT,
    "error_message" TEXT,
    "resolved" BOOLEAN DEFAULT false,
    "resolved_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "retry_count" INTEGER DEFAULT 0,
    "last_retry_at" TIMESTAMP(6),

    CONSTRAINT "failed_webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gallery_images" (
    "id" SERIAL NOT NULL,
    "filename" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "property" TEXT,
    "is_hero" BOOLEAN DEFAULT false,
    "is_featured" BOOLEAN DEFAULT false,
    "display_order" INTEGER DEFAULT 0,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gallery_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "processed_webhook_events" (
    "event_id" TEXT NOT NULL,
    "processed_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "processed_webhook_events_pkey" PRIMARY KEY ("event_id")
);

-- CreateTable
CREATE TABLE "review_requests" (
    "id" SERIAL NOT NULL,
    "booking_id" TEXT NOT NULL,
    "guest_email" TEXT NOT NULL,
    "guest_name" TEXT,
    "accommodation" TEXT,
    "check_out" TEXT,
    "request_count" INTEGER DEFAULT 0,
    "last_request_sent_at" TEXT,
    "last_error" TEXT,
    "status" TEXT DEFAULT 'pending',
    "created_at" TEXT DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" SERIAL NOT NULL,
    "guest_name" TEXT NOT NULL,
    "platform" TEXT DEFAULT 'direct',
    "rating" INTEGER DEFAULT 5,
    "review_text" TEXT,
    "stay_date" DATE,
    "property" TEXT,
    "status" TEXT DEFAULT 'pending',
    "is_featured" BOOLEAN DEFAULT false,
    "admin_notes" TEXT,
    "admin_response" TEXT,
    "response_date" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schema_migrations" (
    "id" SERIAL NOT NULL,
    "filename" TEXT NOT NULL,
    "applied_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "schema_migrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seasonal_rates" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "multiplier" DECIMAL(3,2) DEFAULT 1.00,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seasonal_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_content_drafts" (
    "id" SERIAL NOT NULL,
    "platform" TEXT NOT NULL,
    "source_type" TEXT,
    "source_text" TEXT,
    "accommodation" TEXT,
    "generated_caption" TEXT,
    "hashtags" TEXT,
    "story_text" TEXT,
    "status" TEXT DEFAULT 'draft',
    "created_at" TEXT DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "social_content_drafts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" SERIAL NOT NULL,
    "setting_key" TEXT NOT NULL,
    "setting_value" TEXT,
    "setting_type" TEXT DEFAULT 'string',
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "token_blacklist" (
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "token_blacklist_pkey" PRIMARY KEY ("token_hash")
);

-- CreateTable
CREATE TABLE "rate_limits" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "reset_time" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "rate_limits_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "login_attempts" (
    "ip" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMP(6) NOT NULL DEFAULT to_timestamp(0),
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_attempts_pkey" PRIMARY KEY ("ip")
);

-- CreateTable
CREATE TABLE "blocked_dates" (
    "id" SERIAL NOT NULL,
    "property" TEXT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "reason" TEXT DEFAULT 'maintenance',
    "notes" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blocked_dates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promo_codes" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT DEFAULT 'general',
    "description" TEXT,
    "discount_type" TEXT NOT NULL,
    "discount_value" DECIMAL(10,2) NOT NULL,
    "valid_from" DATE,
    "valid_until" DATE,
    "min_stay" INTEGER,
    "usage_limit" INTEGER,
    "usage_count" INTEGER DEFAULT 0,
    "status" TEXT DEFAULT 'active',
    "partner_info" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promo_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "abandoned_checkout_reminders_booking_id_key" ON "abandoned_checkout_reminders"("booking_id");

-- CreateIndex
CREATE INDEX "idx_audit_logs_action" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "idx_audit_logs_created_at" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "idx_bookings_accommodation" ON "bookings"("accommodation");

-- CreateIndex
CREATE INDEX "idx_bookings_booking_source" ON "bookings"("booking_source");

-- CreateIndex
CREATE INDEX "idx_bookings_check_in" ON "bookings"("check_in");

-- CreateIndex
CREATE INDEX "idx_bookings_check_out" ON "bookings"("check_out");

-- CreateIndex
CREATE INDEX "idx_bookings_created_at" ON "bookings"("created_at");

-- CreateIndex
CREATE INDEX "idx_bookings_dates" ON "bookings"("check_in", "check_out");

-- CreateIndex
CREATE INDEX "idx_bookings_payment_status" ON "bookings"("payment_status");

-- CreateIndex
CREATE INDEX "idx_bookings_status" ON "bookings"("status");

-- CreateIndex
CREATE INDEX "idx_bookings_stripe_session" ON "bookings"("stripe_session_id");

-- CreateIndex
CREATE INDEX "idx_contact_created" ON "contact_messages"("created_at");

-- CreateIndex
CREATE INDEX "idx_failed_webhook_unresolved" ON "failed_webhook_events"("resolved") WHERE (resolved = false);

-- CreateIndex
CREATE UNIQUE INDEX "review_requests_booking_id_key" ON "review_requests"("booking_id");

-- CreateIndex
CREATE UNIQUE INDEX "schema_migrations_filename_key" ON "schema_migrations"("filename");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_setting_key_key" ON "system_settings"("setting_key");

-- CreateIndex
CREATE INDEX "idx_settings_key" ON "system_settings"("setting_key");

-- CreateIndex
CREATE INDEX "idx_rate_limits_reset_time" ON "rate_limits"("reset_time");

-- CreateIndex
CREATE INDEX "idx_login_attempts_locked_until" ON "login_attempts"("locked_until");

-- CreateIndex
CREATE INDEX "idx_blocked_dates_property" ON "blocked_dates"("property");

-- CreateIndex
CREATE INDEX "idx_blocked_dates_range" ON "blocked_dates"("start_date", "end_date");

-- CreateIndex
CREATE UNIQUE INDEX "promo_codes_code_key" ON "promo_codes"("code");

-- CreateIndex
CREATE INDEX "idx_promo_codes_code" ON "promo_codes"("code");

-- CreateIndex
CREATE INDEX "idx_promo_codes_status" ON "promo_codes"("status");

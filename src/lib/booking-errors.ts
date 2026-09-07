/**
 * Distinguishes a permanent date clash from a transient database failure.
 *
 * `idx_bookings_unique_website_dates` is a partial unique index over
 * (accommodation, check_in, check_out), applying only to live website
 * bookings. When two guests pass the availability check and both pay, the
 * first booking is written and the second violates this index.
 *
 * That distinction decides how the Stripe webhook responds. A transient error
 * should be retried; this one never can be — the dates are gone — so retrying
 * just burns three days of Stripe attempts, each writing another failure row
 * and firing another alert, while the guest sits charged with no booking.
 *
 * Verified against a real postgres built from these migrations: the second
 * website booking raises SQLSTATE 23505 with
 * `constraint: idx_bookings_unique_website_dates`, which Prisma surfaces as
 * P2002. An OTA booking or a cancelled website booking for the same dates is
 * still permitted, so neither reaches this path.
 */
export function isDuplicateBookingError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;

  // Prisma reports every unique violation as P2002. The index name is what
  // makes this one specific — another unique conflict (a repeated Stripe
  // session id, say) is a different situation and stays retryable.
  if ((err as { code?: unknown }).code !== "P2002") return false;

  const meta = (err as { meta?: { target?: unknown } }).meta;
  const target = meta?.target;
  const targetText = Array.isArray(target)
    ? target.join(",")
    : String(target ?? "");
  const message = String((err as { message?: unknown }).message ?? "");

  return (
    targetText.includes("idx_bookings_unique_website_dates") ||
    message.includes("idx_bookings_unique_website_dates")
  );
}

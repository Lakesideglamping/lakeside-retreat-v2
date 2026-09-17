import {
  bookingConfirmationHtml,
  bookingConfirmationCottageHtml,
  preArrivalHtml,
  checkoutReviewReminderHtml,
  paymentFailureHtml,
  cancellationHtml,
  systemAlertHtml,
  type BookingEmailData,
} from "./email-templates";

/**
 * The one registry of renderable templates, shared by the admin preview page
 * and the test-send endpoint.
 *
 * Shared deliberately. When the gallery and the sender each kept their own
 * list, the gallery drifted: it previewed a booking confirmation that was
 * never sent, and went on listing the checkout thank-you after that email was
 * deleted. Rendering both from here means "send me a test" delivers exactly
 * what the preview shows, and a template removed from the codebase disappears
 * from both at once.
 */

// Sample booking used to render every template with realistic-looking data.
// Not tied to any real booking — purely for previews and test sends.
export const sampleBooking: BookingEmailData = {
  guest_name: "Sarah Johnson",
  guest_email: "sarah@example.com",
  accommodation: "dome-pinot",
  check_in: "2026-05-12",
  check_out: "2026-05-15",
  num_guests: 2,
  total_price: 1280,
  booking_id: "BK-2026-00042",
  special_requests: "Celebrating our 5th anniversary — any chance of a late checkout?",
};

export type EmailPreview = {
  id: string;
  label: string;
  description: string;
  whenSent: string;
  html: () => string;
};

export const emailPreviews: EmailPreview[] = [
  {
    id: "booking_confirmation",
    label: "Booking confirmation — domes",
    description:
      "Sent to the guest immediately after successful payment. Names the saltwater spa and the dome smoking policy.",
    whenSent: "Stripe checkout succeeds (Dome Pinot / Dome Rosé)",
    html: () => bookingConfirmationHtml(sampleBooking),
  },
  {
    id: "booking_confirmation_cottage",
    label: "Booking confirmation — cottage",
    description:
      "The cottage version of the same email. Names the hot tub rather than the spa, and the other side of the driveway.",
    whenSent: "Stripe checkout succeeds (Lakeside Cottage)",
    // Rendered with the cottage slug, not the shared sample's dome-pinot —
    // otherwise the cottage template would preview saying "Dome Pinot".
    html: () =>
      bookingConfirmationCottageHtml({
        ...sampleBooking,
        accommodation: "lakeside-cottage",
      }),
  },
  {
    id: "pre_arrival",
    label: "Pre-arrival instructions",
    description: "Check-in code, directions, and what to bring.",
    whenSent: "~3 days before check-in (cron)",
    html: () => preArrivalHtml(sampleBooking),
  },
  {
    id: "checkout_review_reminder",
    label: "Post-stay thank-you & review",
    description:
      "Farewell note on departure day, with a gentle review ask and an invitation to reply directly if anything fell short.",
    whenSent: "Check-out day, 6 hours after check-out (cron)",
    html: () => checkoutReviewReminderHtml(sampleBooking),
  },
  {
    id: "cancellation_refund",
    label: "Cancellation — refund eligible",
    description: "Sent when a guest cancels 14+ days out.",
    whenSent: "Stripe refund event or manual cancel",
    html: () => cancellationHtml({ ...sampleBooking, refundEligible: true }),
  },
  {
    id: "cancellation_no_refund",
    label: "Cancellation — non-refundable",
    description: "Sent when a guest cancels within 14 days of arrival.",
    whenSent: "Manual cancel within 14 days",
    html: () => cancellationHtml({ ...sampleBooking, refundEligible: false }),
  },
  {
    id: "payment_failure",
    label: "Payment failure notice",
    description: "Sent when a scheduled payment fails.",
    whenSent: "Stripe payment_intent.payment_failed",
    html: () => paymentFailureHtml(sampleBooking),
  },
  {
    id: "system_alert",
    label: "System alert (host)",
    description: "Internal alert for monitoring failures.",
    whenSent: "Uplisting sync failure, webhook replay, etc.",
    html: () =>
      systemAlertHtml({
        alertType: "error",
        message: "Uplisting sync failed for booking BK-2026-00042",
        details: "Double-booking risk — block dates manually until resolved.",
      }),
  },
];

/** Look up a preview by id. Returns undefined for anything unrecognised. */
export function findEmailPreview(id: string): EmailPreview | undefined {
  return emailPreviews.find((t) => t.id === id);
}

import Link from "next/link";
import {
  bookingConfirmationHtml,
  preArrivalHtml,
  duringStayHtml,
  checkoutThankYouHtml,
  abandonedCheckoutHtml,
  paymentFailureHtml,
  cancellationHtml,
  paymentNotificationHtml,
  systemAlertHtml,
  contactConfirmationHtml,
  type BookingEmailData,
} from "@/lib/email-templates";

// Sample booking used to render every template with realistic-looking data.
// Not tied to any real booking — purely for the admin preview.
const sampleBooking: BookingEmailData = {
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

type TemplateDef = {
  id: string;
  label: string;
  description: string;
  whenSent: string;
  html: () => string;
};

const templates: TemplateDef[] = [
  {
    id: "booking_confirmation",
    label: "Booking confirmation (guest)",
    description: "Sent to the guest immediately after successful payment.",
    whenSent: "Stripe checkout succeeds",
    html: () => bookingConfirmationHtml(sampleBooking),
  },
  {
    id: "pre_arrival",
    label: "Pre-arrival instructions",
    description: "Check-in code, directions, and what to bring.",
    whenSent: "~3 days before check-in (cron)",
    html: () => preArrivalHtml(sampleBooking),
  },
  {
    id: "during_stay",
    label: "Mid-stay check-in",
    description: "Quick hello partway through the stay to catch any issues.",
    whenSent: "Morning of day 2 of stay (cron)",
    html: () => duringStayHtml(sampleBooking),
  },
  {
    id: "checkout_thank_you",
    label: "Checkout thank-you",
    description: "Thank-you note and review request on departure day.",
    whenSent: "Check-out day (cron)",
    html: () => checkoutThankYouHtml(sampleBooking),
  },
  {
    id: "abandoned_checkout_1",
    label: "Abandoned checkout — reminder 1",
    description: "First nudge after a guest starts checkout but doesn't pay.",
    whenSent: "~1 hour after abandonment (cron)",
    html: () => abandonedCheckoutHtml({ ...sampleBooking, reminderNumber: 1 }),
  },
  {
    id: "abandoned_checkout_2",
    label: "Abandoned checkout — reminder 2",
    description: "Second nudge with soft scarcity.",
    whenSent: "~24 hours after abandonment (cron)",
    html: () => abandonedCheckoutHtml({ ...sampleBooking, reminderNumber: 2 }),
  },
  {
    id: "abandoned_checkout_3",
    label: "Abandoned checkout — final",
    description: "Last reminder before the hold is released.",
    whenSent: "~48 hours after abandonment (cron)",
    html: () => abandonedCheckoutHtml({ ...sampleBooking, reminderNumber: 3 }),
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
    id: "payment_notification",
    label: "Payment notification (host)",
    description: "Internal notification to the owner when a payment lands.",
    whenSent: "Stripe payment succeeds",
    html: () =>
      paymentNotificationHtml({
        ...sampleBooking,
        paymentAmount: "1280.00",
        paymentMethod: "Visa ending 4242",
      }),
  },
  {
    id: "contact_confirmation",
    label: "Contact form acknowledgement",
    description: "Auto-reply to guests who submit the contact form.",
    whenSent: "Contact form submission",
    html: () =>
      contactConfirmationHtml({
        name: sampleBooking.guest_name,
        email: sampleBooking.guest_email,
        message: "Hi! Do you allow dogs in the cottage? Planning a 4-night trip in June.",
      }),
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

type PageProps = { searchParams: Promise<{ template?: string }> };

export default async function AdminEmailsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const selectedId = params.template ?? templates[0].id;
  const selected = templates.find((t) => t.id === selectedId) ?? templates[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-semibold text-gray-900">
          Email Templates
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Every email the system sends, rendered with sample data. To change
          wording, tell your developer which template and what to change.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Template list */}
        <aside className="rounded-xl border border-gray-200 bg-white p-3">
          <ul className="space-y-1">
            {templates.map((t) => {
              const active = t.id === selected.id;
              return (
                <li key={t.id}>
                  <Link
                    href={`/admin/emails?template=${t.id}`}
                    className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                      active
                        ? "bg-[#2d5a5a] text-white"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {t.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* Preview panel */}
        <section className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="text-lg font-semibold text-gray-900">
              {selected.label}
            </h2>
            <p className="mt-1 text-sm text-gray-600">{selected.description}</p>
            <dl className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wide text-gray-500">
                  When it sends
                </dt>
                <dd className="text-gray-800">{selected.whenSent}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-gray-500">
                  Sample recipient
                </dt>
                <dd className="text-gray-800">{sampleBooking.guest_email}</dd>
              </div>
            </dl>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-2 text-xs text-gray-600">
              <span>Preview</span>
              <span className="text-gray-400">Rendered with sample booking</span>
            </div>
            <iframe
              title={`${selected.label} preview`}
              srcDoc={selected.html()}
              className="h-[800px] w-full border-0 bg-white"
              sandbox=""
            />
          </div>
        </section>
      </div>
    </div>
  );
}

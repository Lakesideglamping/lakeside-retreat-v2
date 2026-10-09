import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { retrieveCheckoutSession } from "@/lib/stripe";
import { Button } from "@/components/ui/button";
import { TrackPurchase } from "@/components/analytics/track-purchase";

export const metadata: Metadata = {
  title: "Booking Confirmed",
  description: "Your booking at Lakeside Retreat has been confirmed.",
  robots: "noindex",
};

const ACCOMMODATION_LABELS: Record<string, string> = {
  "dome-pinot":      "Dome Pinot",
  "dome-rose":       "Dome Rosé",
  "lakeside-cottage": "Lakeside Cottage",
};

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString("en-NZ", {
    weekday: "short", day: "numeric", month: "long", year: "numeric",
  });
}

function nightsBetween(checkIn: string, checkOut: string): number | undefined {
  const ms = Date.parse(checkOut) - Date.parse(checkIn);
  const nights = Math.round(ms / 86_400_000);
  return Number.isFinite(nights) && nights > 0 ? nights : undefined;
}

export default async function BookingSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;

  // If no session_id provided, redirect to home
  if (!session_id) {
    redirect("/");
  }

  let guestName = "";
  let accommodation = "";
  let checkIn = "";
  let checkOut = "";
  let guests = "";
  let verified = false;
  // Amount actually charged, after any promo or direct-booking discount.
  let amountPaid: number | null = null;
  let currency = "NZD";
  // Stripe answered and says this checkout was never paid.
  let paymentIncomplete = false;

  try {
    const session = await retrieveCheckoutSession(session_id);

    // Only show confirmed page if payment went through
    if (session && (session.payment_status === "paid" || session.status === "complete")) {
      verified = true;
      const meta = session.metadata ?? {};
      guestName     = meta.guestName      ?? session.customer_details?.name ?? "";
      accommodation = meta.accommodation  ?? "";
      checkIn       = meta.checkIn        ?? "";
      checkOut      = meta.checkOut       ?? "";
      guests        = meta.guests         ?? "";
      if (typeof session.amount_total === "number") {
        amountPaid = session.amount_total / 100;
        currency = (session.currency ?? "nzd").toUpperCase();
      }
    } else if (session) {
      paymentIncomplete = true;
    }
    // No session at all (unknown id, or Stripe unreachable) falls through to
    // the generic confirmation: the webhook may already have processed a
    // successful payment, and telling a paying guest their booking failed is
    // worse than a page without details.
  } catch {
    // Same as above — generic confirmation.
  }

  // Outside the try: redirect() works by throwing, and the catch above used to
  // swallow it, so an unpaid checkout was shown "Booking Confirmed!".
  if (paymentIncomplete) {
    redirect("/booking-cancelled");
  }

  return (
    <section className="min-h-[70vh] flex items-center justify-center px-5 pt-24 pb-20">
      {verified && amountPaid !== null && (
        <TrackPurchase
          transactionId={session_id}
          accommodationId={accommodation || "unknown"}
          accommodationName={ACCOMMODATION_LABELS[accommodation] ?? (accommodation || "Booking")}
          value={amountPaid}
          currency={currency}
          nights={nightsBetween(checkIn, checkOut)}
        />
      )}
      <div className="max-w-[600px] mx-auto text-center">
        <div className="text-5xl mb-6 text-burgundy">&#10003;</div>
        <h1 className="font-display text-4xl mb-4">Booking Confirmed!</h1>

        {verified && guestName && (
          <p className="text-lg text-muted mb-2">
            Thank you, <strong>{guestName}</strong>!
          </p>
        )}

        <p className="text-lg text-muted mb-6">
          Your booking is confirmed and a confirmation email has been sent with
          all the details.
        </p>

        {/* Booking summary — only shown when we have session metadata */}
        {verified && accommodation && checkIn && checkOut && (
          <div className="bg-cream rounded-xl p-6 mb-6 text-left">
            <h2 className="font-display text-xl mb-3">Your Booking</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted text-xs uppercase tracking-wider mb-0.5">Property</p>
                <p className="font-semibold">
                  {ACCOMMODATION_LABELS[accommodation] ?? accommodation}
                </p>
              </div>
              {guests && (
                <div>
                  <p className="text-muted text-xs uppercase tracking-wider mb-0.5">Guests</p>
                  <p className="font-semibold">{guests}</p>
                </div>
              )}
              <div>
                <p className="text-muted text-xs uppercase tracking-wider mb-0.5">Check-in</p>
                <p className="font-semibold">{formatDate(checkIn)}</p>
              </div>
              <div>
                <p className="text-muted text-xs uppercase tracking-wider mb-0.5">Check-out</p>
                <p className="font-semibold">{formatDate(checkOut)}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-cream rounded-xl p-6 mb-8 text-left">
          <h2 className="font-display text-xl mb-3">What Happens Next</h2>
          <ul className="space-y-2 text-muted">
            <li>&bull; Check your email for your booking confirmation</li>
            <li>&bull; Self-check-in instructions will be sent 2 days before arrival</li>
            <li>&bull; Check-in is from 3:00 PM, check-out by 10:00 AM</li>
          </ul>
        </div>

        <div className="flex gap-4 justify-center flex-wrap">
          <Button href="/">Back to Homepage</Button>
          <Link
            href="/guides"
            className="inline-block px-6 py-3 rounded-full border-2 border-burgundy text-burgundy font-semibold hover:-translate-y-0.5 transition-transform no-underline"
          >
            Plan Your Trip
          </Link>
        </div>
      </div>
    </section>
  );
}

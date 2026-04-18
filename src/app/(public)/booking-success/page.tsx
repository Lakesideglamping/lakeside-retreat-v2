import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import Stripe from "stripe";
import { Button } from "@/components/ui/button";

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

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-02-25.clover" });
    const session = await stripe.checkout.sessions.retrieve(session_id);

    // Only show confirmed page if payment went through
    if (session.payment_status === "paid" || session.status === "complete") {
      verified = true;
      const meta = session.metadata ?? {};
      guestName     = meta.guestName      ?? session.customer_details?.name ?? "";
      accommodation = meta.accommodation  ?? "";
      checkIn       = meta.checkIn        ?? "";
      checkOut      = meta.checkOut       ?? "";
      guests        = meta.guests         ?? "";
    } else {
      // Payment not completed — send to cancelled
      redirect("/booking-cancelled");
    }
  } catch {
    // Invalid session_id — just show generic confirmation
    // (webhook may have already processed it successfully)
  }

  return (
    <section className="min-h-[70vh] flex items-center justify-center px-5 pt-24 pb-20">
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
            <li>&bull; A $300 security bond has been pre-authorised and will be released after checkout</li>
          </ul>
        </div>

        <div className="flex gap-4 justify-center flex-wrap">
          <Button href="/">Back to Homepage</Button>
          <Link
            href="/explore"
            className="inline-block px-6 py-3 rounded-full border-2 border-burgundy text-burgundy font-semibold hover:-translate-y-0.5 transition-transform no-underline"
          >
            Plan Your Trip
          </Link>
        </div>
      </div>
    </section>
  );
}

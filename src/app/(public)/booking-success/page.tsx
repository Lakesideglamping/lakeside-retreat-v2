import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Booking Confirmed",
  description: "Your booking at Lakeside Retreat has been confirmed.",
  robots: "noindex",
};

export default function BookingSuccessPage() {
  return (
    <section className="min-h-[70vh] flex items-center justify-center px-5 pt-24 pb-20">
      <div className="max-w-[600px] mx-auto text-center">
        <div className="text-5xl mb-6">&#10003;</div>
        <h1 className="font-display text-4xl mb-4">Booking Confirmed!</h1>
        <p className="text-lg text-muted mb-4">
          Thank you for booking with Lakeside Retreat. A confirmation email has
          been sent with your booking details.
        </p>
        <div className="bg-cream rounded-xl p-6 mb-8 text-left">
          <h2 className="font-display text-xl mb-3">What Happens Next</h2>
          <ul className="space-y-2 text-muted">
            <li>&bull; Check your email for your booking confirmation</li>
            <li>
              &bull; Self-check-in instructions will be sent 2 days before
              arrival
            </li>
            <li>&bull; Check-in is from 3:00 PM, check-out by 10:00 AM</li>
            <li>
              &bull; A $300 security bond has been pre-authorised and will be
              released after checkout
            </li>
          </ul>
        </div>
        <div className="flex gap-4 justify-center flex-wrap">
          <Button href="/">Back to Homepage</Button>
          <Link
            href="/explore"
            className="inline-block px-6 py-3 rounded-full border-2 border-teal text-teal font-semibold hover:-translate-y-0.5 transition-transform no-underline"
          >
            Plan Your Trip
          </Link>
        </div>
      </div>
    </section>
  );
}

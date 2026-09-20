import type { Metadata } from "next";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Booking Cancelled",
  description: "Your booking was not completed.",
  robots: "noindex",
};

export default function BookingCancelledPage() {
  return (
    <section className="min-h-[70vh] flex items-center justify-center px-5 pt-24 pb-20">
      <div className="max-w-[600px] mx-auto text-center">
        <h1 className="font-display text-4xl mb-4">Booking Not Completed</h1>
        <p className="text-lg text-muted mb-8">
          Your payment was cancelled and no charge has been made. If you
          experienced any issues, please don&apos;t hesitate to contact us.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Button href="/stay">View Accommodation</Button>
          {/*
            outline-dark, not outline. The "outline" variant is white border on
            white text, which only works over a dark hero — the three property
            pages use it correctly that way, inside a bg-black/30 overlay. This
            page has no hero: it sits on the plain cream background, where white
            on cream left the button all but invisible. Same variant as "Meet
            Your Hosts" on the homepage, which is the same shape of secondary
            action on the same background.
          */}
          <Button href="/contact" variant="outline-dark">
            Contact Us
          </Button>
        </div>
      </div>
    </section>
  );
}

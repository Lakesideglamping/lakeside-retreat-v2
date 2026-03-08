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
          <Button href="/contact" variant="outline">
            Contact Us
          </Button>
        </div>
      </div>
    </section>
  );
}

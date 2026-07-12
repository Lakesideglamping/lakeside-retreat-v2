import type { Metadata } from "next";
import { Suspense } from "react";
import Image from "next/image";
import { BookingWidget } from "@/components/booking/booking-widget";
import {
  JsonLd,
  createBreadcrumbSchema,
} from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "Book Your Stay | Lakeside Retreat",
  description:
    "Book your luxury glamping escape at Lakeside Retreat on Lake Dunstan, Central Otago. Choose from geodesic domes and a lakeside cottage.",
  robots: "noindex",
};

export default function BookPage() {
  return (
    <>
      <JsonLd
        data={[
          createBreadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Accommodation", path: "/stay" },
            { name: "Book", path: "/book" },
          ]),
        ]}
      />

      {/* Hero */}
      <section className="relative min-h-[40vh] flex items-center justify-center text-center text-white">
        <Image
          src="/images/LakeDunstan.jpeg"
          alt="Glamping domes at sunset overlooking Lake Dunstan"
          fill
          priority
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/45" />
        <div className="relative z-10 max-w-[700px] px-5 pt-20">
          <h1 className="font-display text-4xl md:text-5xl text-white mb-3 drop-shadow-lg">
            Book Your Stay
          </h1>
          <p className="text-lg opacity-95">
            Your stay begins here.
          </p>
        </div>
      </section>

      {/* Booking widget */}
      <section className="py-16 px-5">
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-burgundy border-t-transparent" />
            </div>
          }
        >
          <BookingWidget />
        </Suspense>
      </section>

      {/* Trust signals */}
      <section className="pb-16 px-5">
        <div className="max-w-[800px] mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
            <div className="bg-cream rounded-xl p-4">
              <p className="text-2xl mb-1">&#128274;</p>
              <p className="font-semibold text-body">Secure Payment</p>
              <p className="text-xs text-muted">Powered by Stripe</p>
            </div>
            <div className="bg-cream rounded-xl p-4">
              <p className="text-2xl mb-1">&#9733;</p>
              <p className="font-semibold text-body">4.9/5 Rating</p>
              <p className="text-xs text-muted">416+ reviews</p>
            </div>
            <div className="bg-cream rounded-xl p-4">
              <p className="text-2xl mb-1">&#128176;</p>
              <p className="font-semibold text-body">Best Price</p>
              <p className="text-xs text-muted">Save vs. Airbnb</p>
            </div>
            <div className="bg-cream rounded-xl p-4">
              <p className="text-2xl mb-1">&#10003;</p>
              <p className="font-semibold text-body">Free Cancellation</p>
              <p className="text-xs text-muted">7+ days before</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

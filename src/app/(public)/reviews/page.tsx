import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { JsonLd, createOrganizationSchema, createBreadcrumbSchema } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "Guest Reviews",
  description:
    "Read verified guest reviews of Lakeside Retreat Central Otago. Rated 4.9 stars from 127 reviews across Airbnb, Booking.com and direct bookings.",
};

const stats = [
  { label: "Overall Rating", value: "4.9", sub: "out of 5 stars" },
  { label: "Verified Reviews", value: "127", sub: "across all platforms" },
  { label: "Return Guests", value: "45%", sub: "come back again" },
  { label: "Would Recommend", value: "98%", sub: "to friends & family" },
];

const reviews = [
  {
    author: "Sarah & James",
    date: "December 2024",
    accommodation: "Dome Pinot",
    source: "Airbnb",
    text: "Absolutely magical! The dome was stunning with incredible lake views. Stephen and Sandy were wonderful hosts who recommended some amazing wineries. We didn't want to leave!",
  },
  {
    author: "Mike & Family",
    date: "November 2024",
    accommodation: "Lakeside Cottage",
    source: "Direct Booking",
    text: "Perfect for our family getaway. The kids loved swimming in the lake and we brought our dog too! The kitchen was fully equipped and the BBQ was a bonus. Will definitely return.",
  },
  {
    author: "Emma",
    date: "October 2024",
    accommodation: "Dome Ros\u00e9",
    source: "Airbnb",
    text: "The private spa was heavenly! Watching the sunset over the vineyards while soaking in the hot tub was the highlight of our trip. The quality of the linens and the welcome basket were lovely touches.",
  },
  {
    author: "David & Lisa",
    date: "September 2024",
    accommodation: "Dome Pinot",
    source: "Booking.com",
    text: "We loved that the property is solar-powered. Close enough to Queenstown for day trips but peaceful at night. The Rail Trail access was perfect for morning bike rides.",
  },
  {
    author: "Rachel",
    date: "August 2024",
    accommodation: "Dome Ros\u00e9",
    source: "Return Guest",
    text: "Our third stay and it just keeps getting better. The hosts remember us and always go the extra mile. Winter mountain views from the hot tub are unbeatable!",
  },
  {
    author: "Tom & Anna",
    date: "July 2024",
    accommodation: "Dome Pinot",
    source: "Airbnb",
    text: "Celebrated our anniversary here and it was perfection. The dome felt like a luxury hotel but with so much more character. Stephen's wine recommendations were spot on!",
  },
];

export default function ReviewsPage() {
  return (
    <>
      <JsonLd data={[
        createOrganizationSchema(),
        createBreadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Reviews", path: "/reviews" },
        ]),
      ]} />
      {/* Hero */}
      <section
        className="relative min-h-[50vh] flex items-center justify-center text-center text-white bg-cover bg-center"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('/images/domesmountainview.jpeg')",
        }}
      >
        <div className="pt-20 px-5">
          <h1 className="font-display text-5xl text-white mb-4">Guest Reviews</h1>
          <p className="text-xl opacity-95">
            See what our guests say about their Lakeside Retreat experience
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-5 bg-white">
        <div className="max-w-[1000px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="text-4xl font-bold text-teal mb-1">{s.value}</div>
              <div className="font-semibold text-body text-sm">{s.label}</div>
              <div className="text-muted text-xs">{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Reviews */}
      <section className="py-20 px-5">
        <div className="max-w-[1200px] mx-auto">
          <h2 className="font-display text-4xl text-center mb-4">What Our Guests Say</h2>
          <p className="text-center text-muted text-lg mb-12">
            Authentic reviews from Airbnb, Booking.com, and direct bookings
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {reviews.map((r) => (
              <div key={r.author} className="bg-white rounded-2xl p-8 shadow-md">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-burgundy to-teal-dark flex items-center justify-center text-white font-bold text-lg">
                    {r.author[0]}
                  </div>
                  <div>
                    <div className="font-semibold">{r.author}</div>
                    <div className="text-muted text-xs">{r.date}</div>
                  </div>
                </div>
                <div className="text-yellow-500 text-sm mb-3">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
                <p className="text-muted text-sm leading-7 mb-4 italic">
                  &ldquo;{r.text}&rdquo;
                </p>
                <div className="flex items-center justify-between text-xs">
                  <span className="bg-cream px-3 py-1 rounded-full text-teal font-medium">
                    {r.accommodation}
                  </span>
                  <span className="text-muted">{r.source}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-5 bg-white text-center">
        <div className="max-w-[600px] mx-auto">
          <h2 className="font-display text-4xl mb-4">
            Ready to Create Your Own Memories?
          </h2>
          <p className="text-lg text-muted mb-8">
            Join our community of happy guests and experience Central Otago&apos;s finest
            accommodation.
          </p>
          <Button href="/#booking">Book Your Stay</Button>
        </div>
      </section>
    </>
  );
}

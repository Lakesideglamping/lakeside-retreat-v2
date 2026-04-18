import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { JsonLd, createOrganizationSchema, createBreadcrumbSchema } from "@/lib/structured-data";
import { ReviewsList } from "@/components/reviews-list";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Guest Reviews | 4.9★ Rated Accommodation, Central Otago",
  description:
    "Read 416 verified guest reviews of Lakeside Retreat, Cromwell. 4.9/5 stars across Airbnb, Booking.com, and direct bookings. Central Otago's top-rated glamping.",
};

export default async function ReviewsPage() {
  const [reviews, summary] = await Promise.all([
    prisma.reviews.findMany({
      where: { status: "approved" },
      orderBy: { stay_date: "desc" },
    }),
    prisma.reviews.aggregate({
      where: { status: "approved" },
      _count: true,
      _avg: { rating: true },
    }),
  ]);

  const totalReviews = summary._count;
  const avgRating = summary._avg.rating
    ? Number(summary._avg.rating).toFixed(1)
    : "0.0";

  const stats = [
    { label: "Overall Rating", value: avgRating !== "0.0" ? avgRating : "4.9", sub: "out of 5 stars" },
    { label: "Verified Reviews", value: String(totalReviews), sub: "across all platforms" },
    { label: "Return Guests", value: "45%", sub: "come back again" },
    { label: "Would Recommend", value: "98%", sub: "to friends & family" },
  ];

  // Serialize for client component
  const serializedReviews = reviews.map((r) => ({
    id: r.id,
    guest_name: r.guest_name,
    platform: r.platform,
    rating: r.rating,
    review_text: r.review_text,
    stay_date: r.stay_date ? r.stay_date.toISOString() : null,
    property: r.property,
  }));

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
              <div className="text-4xl font-bold text-burgundy mb-1">{s.value}</div>
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
          <p className="text-center text-muted text-lg mb-8">
            Authentic reviews from Airbnb, Booking.com, and direct bookings
          </p>
          <ReviewsList reviews={serializedReviews} />
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
          <Button href="/book">Book Your Stay</Button>
        </div>
      </section>
    </>
  );
}
